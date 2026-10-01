const { describe, test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");

// Replace only the database boundary; load the real routes, controller and repository.
const calls = [];
let execute = async () => [[]];
require.cache[require.resolve("../src/config/db")] = {
  id: require.resolve("../src/config/db"), loaded: true,
  exports: { execute: async (sql, params) => { calls.push({ sql, params }); return execute(sql, params); } },
};
process.env.JWT_SECRET = "dashboard-test-only-secret";
const app = require("../src/app");
const {
  roundMoney,
  monthlyCost,
  toDateKey,
  todayKey,
  daysBetween,
  summarize,
  spendByCategory,
  renewalsOverview,
  buildDashboard,
  UNKNOWN_CATEGORY,
} = require("../src/services/dashboardStats");
const { parseWindowDays } = require("../src/controllers/dashboardController");

// ---------------------------------------------------------------------------
// Calculations (pure functions, fixed date)
// ---------------------------------------------------------------------------

const TODAY = "2026-10-01";

const CATEGORIES = [
  { id: "cat_web", name: "Web Development", color: "#aa3bff" },
  { id: "cat_design", name: "Design", color: "#3b82f6" },
];

function svc(overrides) {
  return {
    id: overrides.name.toLowerCase(),
    category: "cat_web",
    cost: 10,
    billingCycle: "monthly",
    renewalDate: "2026-10-15",
    status: "active",
    ...overrides,
  };
}

describe("roundMoney", () => {
  test("rounds to cents", () => {
    assert.equal(roundMoney(19.999999), 20);
    assert.equal(roundMoney(10 / 3), 3.33);
  });
  test("treats junk as 0", () => {
    assert.equal(roundMoney("abc"), 0);
    assert.equal(roundMoney(undefined), 0);
  });
});

describe("monthlyCost", () => {
  test("normalises each billing cycle to a month", () => {
    assert.equal(monthlyCost({ cost: 30, billingCycle: "monthly" }), 30);
    assert.equal(monthlyCost({ cost: 30, billingCycle: "quarterly" }), 10);
    assert.equal(monthlyCost({ cost: 120, billingCycle: "yearly" }), 10);
  });
  test("one-time and unknown cycles count as 0", () => {
    assert.equal(monthlyCost({ cost: 500, billingCycle: "one_time" }), 0);
    assert.equal(monthlyCost({ cost: 500, billingCycle: "weekly" }), 0);
  });
  test("accepts numeric strings, ignores bad or negative costs", () => {
    assert.equal(monthlyCost({ cost: "12.5", billingCycle: "monthly" }), 12.5);
    assert.equal(monthlyCost({ cost: "x", billingCycle: "monthly" }), 0);
    assert.equal(monthlyCost({ cost: -5, billingCycle: "monthly" }), 0);
  });
});

describe("dates", () => {
  test("toDateKey accepts ISO strings and Date objects", () => {
    assert.equal(toDateKey("2026-11-01"), "2026-11-01");
    assert.equal(toDateKey("2026-11-01T00:00:00.000Z"), "2026-11-01");
    assert.equal(toDateKey(new Date("2026-11-01")), "2026-11-01");
  });
  test("toDateKey rejects invalid values", () => {
    assert.equal(toDateKey("2026-02-30"), null);
    assert.equal(toDateKey("not a date"), null);
    assert.equal(toDateKey(""), null);
    assert.equal(toDateKey(null), null);
    assert.equal(toDateKey(new Date("nope")), null);
  });
  test("todayKey uses the local calendar date", () => {
    assert.equal(todayKey(new Date(2026, 0, 5, 23, 30)), "2026-01-05");
  });
  test("daysBetween counts whole days across months and years", () => {
    assert.equal(daysBetween("2026-10-01", "2026-10-01"), 0);
    assert.equal(daysBetween("2026-10-01", "2026-10-08"), 7);
    assert.equal(daysBetween("2026-10-01", "2026-09-30"), -1);
    assert.equal(daysBetween("2026-12-31", "2027-01-01"), 1);
    assert.equal(daysBetween("2028-02-28", "2028-03-01"), 2); // leap year
  });
});

describe("summarize", () => {
  test("counts services and sums active spend only", () => {
    const services = [
      svc({ name: "A", cost: 20 }),
      svc({ name: "B", cost: 120, billingCycle: "yearly" }),
      svc({ name: "C", cost: 99, status: "inactive" }),
    ];
    const s = summarize(services, CATEGORIES, TODAY);
    assert.equal(s.totalServices, 3);
    assert.equal(s.activeServices, 2);
    assert.equal(s.inactiveServices, 1);
    assert.equal(s.monthlySpend, 30);
    assert.equal(s.yearlySpend, 360);
  });

  test("yearly estimate is computed before rounding", () => {
    const s = summarize([svc({ name: "Q", cost: 10, billingCycle: "quarterly" })], [], TODAY);
    assert.equal(s.monthlySpend, 3.33);
    assert.equal(s.yearlySpend, 40);
  });

  test("next renewal is the soonest active one from today onwards", () => {
    const services = [
      svc({ name: "Past", renewalDate: "2026-09-20" }),
      svc({ name: "Later", renewalDate: "2026-12-01" }),
      svc({ name: "Soon", renewalDate: "2026-10-03" }),
      svc({ name: "Off", renewalDate: "2026-10-02", status: "inactive" }),
    ];
    const s = summarize(services, CATEGORIES, TODAY);
    assert.equal(s.nextRenewal.name, "Soon");
    assert.equal(s.nextRenewal.daysUntil, 2);
    assert.equal(s.nextRenewal.categoryName, "Web Development");
  });

  test("a renewal due today counts as the next renewal", () => {
    const s = summarize([svc({ name: "Today", renewalDate: TODAY })], CATEGORIES, TODAY);
    assert.equal(s.nextRenewal.daysUntil, 0);
  });

  test("empty input gives zeros and no next renewal", () => {
    const s = summarize([], [], TODAY);
    assert.deepEqual(s, {
      totalServices: 0,
      activeServices: 0,
      inactiveServices: 0,
      monthlySpend: 0,
      yearlySpend: 0,
      nextRenewal: null,
    });
  });
});

describe("spendByCategory", () => {
  test("groups monthly spend by category, biggest first, with share", () => {
    const rows = spendByCategory(
      [
        svc({ name: "A", category: "cat_web", cost: 10 }),
        svc({ name: "B", category: "cat_web", cost: 20 }),
        svc({ name: "C", category: "cat_design", cost: 120, billingCycle: "yearly" }),
      ],
      CATEGORIES,
    );
    assert.deepEqual(
      rows.map((r) => [r.id, r.count, r.monthly, r.yearly, r.share]),
      [
        ["cat_web", 2, 30, 360, 75],
        ["cat_design", 1, 10, 120, 25],
      ],
    );
    assert.equal(rows[0].color, "#aa3bff");
  });

  test("skips inactive, one-time and zero-cost services", () => {
    const rows = spendByCategory(
      [
        svc({ name: "Off", status: "inactive" }),
        svc({ name: "Once", billingCycle: "one_time", cost: 300 }),
        svc({ name: "Free", cost: 0 }),
      ],
      CATEGORIES,
    );
    assert.deepEqual(rows, []);
  });

  test("services with a missing category go under Unknown", () => {
    const rows = spendByCategory([svc({ name: "Lost", category: "cat_deleted" })], CATEGORIES);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].id, UNKNOWN_CATEGORY.id);
    assert.equal(rows[0].share, 100);
  });

  test("matches numeric and string category ids by value", () => {
    const rows = spendByCategory(
      [svc({ name: "A", category: 12 })],
      [{ id: "12", name: "Design", color: "#3b82f6" }],
    );
    assert.equal(rows[0].name, "Design");
  });

  test("shares add up to about 100", () => {
    const rows = spendByCategory(
      [
        svc({ name: "A", category: "cat_web", cost: 10 }),
        svc({ name: "B", category: "cat_design", cost: 10 }),
        svc({ name: "C", category: "x", cost: 10 }),
      ],
      CATEGORIES,
    );
    const total = rows.reduce((sum, r) => sum + r.share, 0);
    assert.ok(Math.abs(total - 100) < 0.5, `shares sum to ${total}`);
  });
});

describe("renewalsOverview", () => {
  const services = [
    svc({ name: "Today", renewalDate: "2026-10-01" }),
    svc({ name: "In7", renewalDate: "2026-10-08" }),
    svc({ name: "In8", renewalDate: "2026-10-09" }),
    svc({ name: "Yesterday", renewalDate: "2026-09-30" }),
    svc({ name: "LongAgo", renewalDate: "2026-08-01" }),
    svc({ name: "OffOverdue", renewalDate: "2026-09-01", status: "inactive" }),
    svc({ name: "NoDate", renewalDate: "" }),
  ];

  test("upcoming includes today through the window end, soonest first", () => {
    const r = renewalsOverview(services, CATEGORIES, TODAY, 7);
    assert.deepEqual(r.upcoming.map((x) => [x.name, x.daysUntil]), [
      ["Today", 0],
      ["In7", 7],
    ]);
    assert.equal(r.windowDays, 7);
  });

  test("overdue lists active past renewals, most overdue first", () => {
    const r = renewalsOverview(services, CATEGORIES, TODAY, 7);
    assert.deepEqual(r.overdue.map((x) => x.name), ["LongAgo", "Yesterday"]);
    assert.equal(r.overdue[1].daysUntil, -1);
  });

  test("window size is respected", () => {
    assert.equal(renewalsOverview(services, CATEGORIES, TODAY, 1).upcoming.length, 1);
    assert.equal(renewalsOverview(services, CATEGORIES, TODAY, 14).upcoming.length, 3);
  });

  test("items carry the fields the dashboard renders", () => {
    const [item] = renewalsOverview([svc({ name: "X", cost: 9.999 })], CATEGORIES, TODAY, 30).upcoming;
    assert.deepEqual(item, {
      id: "x",
      name: "X",
      category: "cat_web",
      categoryName: "Web Development",
      categoryColor: "#aa3bff",
      cost: 10,
      billingCycle: "monthly",
      renewalDate: "2026-10-15",
      daysUntil: 14,
    });
  });
});

describe("buildDashboard", () => {
  test("combines all sections for the given day", () => {
    const d = buildDashboard([svc({ name: "A" })], CATEGORIES, { today: TODAY, windowDays: 30 });
    assert.equal(d.generatedFor, TODAY);
    assert.equal(d.summary.totalServices, 1);
    assert.equal(d.spendByCategory.length, 1);
    assert.equal(d.renewals.upcoming.length, 1);
  });

  test("handles missing arrays without throwing", () => {
    const d = buildDashboard(undefined, undefined, { today: TODAY });
    assert.equal(d.summary.totalServices, 0);
    assert.deepEqual(d.spendByCategory, []);
    assert.deepEqual(d.renewals, { windowDays: 7, upcoming: [], overdue: [] });
  });
});

// ---------------------------------------------------------------------------
// HTTP: /api/dashboard with the database pool substituted
// ---------------------------------------------------------------------------

let server, base;
before(async () => {
  server = app.listen(0, "127.0.0.1");
  await new Promise((resolve, reject) => { server.once("listening", resolve); server.once("error", reject); });
  base = `http://127.0.0.1:${server.address().port}`;
});
after(async () => { if (server) await new Promise((resolve) => server.close(resolve)); });

async function request(path, token = jwt.sign({ sub: "7" }, process.env.JWT_SECRET)) {
  const response = await fetch(base + path, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return { status: response.status, body: await response.json() };
}

// The routes use the real clock, so fixture dates are relative to today.
function inDays(n) {
  const [y, m, d] = todayKey().split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

// Rows as mysql2 returns them: numeric ids, DECIMAL cost as a string.
const SERVICE_ROWS = [
  { id: 1, category_id: 3, name: "Hosting", cost: "20.00", billing_cycle: "monthly", renewal_date: inDays(2), status: "active" },
  { id: 2, category_id: 4, name: "Figma", cost: "120.00", billing_cycle: "yearly", renewal_date: inDays(-6), status: "active" },
  { id: 3, category_id: 3, name: "Old tool", cost: "50.00", billing_cycle: "monthly", renewal_date: inDays(1), status: "inactive" },
  { id: 4, category_id: 3, name: "Domain", cost: "30.00", billing_cycle: "quarterly", renewal_date: inDays(50), status: "active" },
];
const CATEGORY_ROWS = [
  { id: 3, name: "Web Development", color: "#aa3bff" },
  { id: 4, name: "Design", color: "#3b82f6" },
];

function useRows(services = SERVICE_ROWS, categories = CATEGORY_ROWS) {
  execute = async (sql) => [sql.includes("FROM services") ? services : categories];
}

describe("GET /api/dashboard", () => {
  test("all dashboard routes require a valid JWT", async () => {
    for (const path of ["", "/summary", "/spend-by-category", "/renewals"]) {
      for (const token of [null, "invalid", jwt.sign({ sub: "7", exp: 1 }, process.env.JWT_SECRET)]) {
        calls.length = 0;
        assert.equal((await request(`/api/dashboard${path}`, token)).status, 401);
        assert.equal(calls.length, 0);
      }
    }
  });

  test("queries only the JWT owner's rows, ignoring a supplied user_id", async () => {
    useRows();
    calls.length = 0;
    assert.equal((await request("/api/dashboard?user_id=99")).status, 200);
    assert.equal(calls.length, 2);
    for (const call of calls) {
      assert.deepEqual(call.params, [7]);
      assert.match(call.sql, /WHERE user_id = \?/);
    }
  });

  test("returns summary, category spend and renewals together", async () => {
    useRows();
    const res = await request("/api/dashboard");
    assert.equal(res.status, 200);
    assert.equal(res.body.generatedFor, todayKey());
    assert.equal(res.body.summary.totalServices, 4);
    assert.equal(res.body.summary.monthlySpend, 40); // 20 + 120/12 + 30/3
    assert.equal(res.body.summary.yearlySpend, 480);
    assert.equal(res.body.summary.nextRenewal.name, "Hosting");
    assert.equal(res.body.spendByCategory[0].id, "3");
    assert.deepEqual(res.body.renewals.overdue.map((r) => r.name), ["Figma"]);
  });

  test("maps MySQL rows to string ids and numeric costs", async () => {
    useRows();
    const res = await request("/api/dashboard");
    const next = res.body.summary.nextRenewal;
    assert.equal(next.id, "1");
    assert.equal(next.category, "3");
    assert.equal(next.categoryName, "Web Development");
    assert.equal(next.cost, 20);
    assert.equal(next.renewalDate, inDays(2));
  });

  test("an account with no services gets zeros, not an error", async () => {
    useRows([], []);
    const res = await request("/api/dashboard");
    assert.equal(res.status, 200);
    assert.equal(res.body.summary.totalServices, 0);
    assert.equal(res.body.summary.nextRenewal, null);
    assert.deepEqual(res.body.spendByCategory, []);
  });

  test("database errors return a safe 500 message", async () => {
    execute = async () => { throw Object.assign(new Error("connect ECONNREFUSED secret-host"), { code: "ECONNREFUSED" }); };
    for (const path of ["", "/summary", "/spend-by-category", "/renewals"]) {
      const res = await request(`/api/dashboard${path}`);
      assert.equal(res.status, 500);
      assert.doesNotMatch(res.body.message, /secret-host|ECONNREFUSED/);
    }
  });
});

describe("GET /api/dashboard/summary", () => {
  test("returns counts and spend", async () => {
    useRows();
    const res = await request("/api/dashboard/summary");
    assert.equal(res.status, 200);
    assert.equal(res.body.activeServices, 3);
    assert.equal(res.body.inactiveServices, 1);
    assert.equal(res.body.monthlySpend, 40);
  });
});

describe("GET /api/dashboard/spend-by-category", () => {
  test("returns categories ordered by monthly spend", async () => {
    useRows();
    const res = await request("/api/dashboard/spend-by-category");
    assert.equal(res.status, 200);
    assert.deepEqual(
      res.body.map((r) => [r.name, r.monthly, r.share]),
      [
        ["Web Development", 30, 75],
        ["Design", 10, 25],
      ],
    );
  });
});

describe("GET /api/dashboard/renewals", () => {
  test("defaults to a 7-day window", async () => {
    useRows();
    const res = await request("/api/dashboard/renewals");
    assert.equal(res.status, 200);
    assert.equal(res.body.windowDays, 7);
    assert.deepEqual(res.body.upcoming.map((r) => r.name), ["Hosting"]);
  });

  test("accepts a custom window", async () => {
    useRows();
    const res = await request("/api/dashboard/renewals?days=60");
    assert.deepEqual(res.body.upcoming.map((r) => r.name), ["Hosting", "Domain"]);
  });

  for (const bad of ["0", "-3", "2.5", "abc", "366", "1e2"]) {
    test(`rejects days=${bad} with 400 before querying`, async () => {
      useRows();
      calls.length = 0;
      for (const path of ["/api/dashboard", "/api/dashboard/renewals"]) {
        const res = await request(`${path}?days=${bad}`);
        assert.equal(res.status, 400);
        assert.match(res.body.message, /days/);
      }
      assert.equal(calls.length, 0);
    });
  }
});

describe("parseWindowDays", () => {
  test("defaults and accepts the allowed range", () => {
    assert.equal(parseWindowDays(undefined), 7);
    assert.equal(parseWindowDays(""), 7);
    assert.equal(parseWindowDays("1"), 1);
    assert.equal(parseWindowDays("365"), 365);
  });
  test("rejects repeated query values", () => {
    assert.equal(parseWindowDays(["7", "8"]), null);
  });
});
