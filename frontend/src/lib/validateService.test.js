import { describe, it, expect } from "vitest";
import {
  validateService,
  validateCategory,
  isValid,
  SERVICE_LIMITS,
  CATEGORY_LIMITS,
} from "./validateService";

const categories = [
  { id: "cat_web", name: "Web" },
  { id: "cat_design", name: "Design" },
];

const validDraft = {
  name: "Figma Organization",
  category: "cat_design",
  cost: "45",
  billingCycle: "monthly",
  renewalDate: "2027-01-15",
  status: "active",
  notes: "Team plan.",
};

describe("validateService — happy path", () => {
  it("returns no errors for a valid draft", () => {
    const errors = validateService(validDraft, { categories });
    expect(errors).toEqual({});
    expect(isValid(errors)).toBe(true);
  });

  it("accepts cost of exactly 0", () => {
    expect(validateService({ ...validDraft, cost: "0" }, { categories })).toEqual(
      {},
    );
  });

  it("accepts a numeric cost (not just strings)", () => {
    expect(validateService({ ...validDraft, cost: 42.5 }, { categories })).toEqual(
      {},
    );
  });

  it("does not restrict category when no category list is supplied", () => {
    const errors = validateService({ ...validDraft, category: "anything" });
    expect(errors.category).toBeUndefined();
  });
});

describe("validateService — name", () => {
  it("requires a name", () => {
    expect(validateService({ ...validDraft, name: "" }, { categories }).name).toBe(
      "Name is required.",
    );
  });

  it("treats whitespace-only as empty", () => {
    expect(
      validateService({ ...validDraft, name: "   " }, { categories }).name,
    ).toBe("Name is required.");
  });

  it("rejects names below the minimum length", () => {
    expect(
      validateService({ ...validDraft, name: "a" }, { categories }).name,
    ).toMatch(/at least/);
  });

  it("accepts a name exactly at the minimum length", () => {
    const name = "x".repeat(SERVICE_LIMITS.name.min);
    expect(
      validateService({ ...validDraft, name }, { categories }).name,
    ).toBeUndefined();
  });

  it("accepts a name exactly at the maximum length", () => {
    const name = "x".repeat(SERVICE_LIMITS.name.max);
    expect(
      validateService({ ...validDraft, name }, { categories }).name,
    ).toBeUndefined();
  });

  it("rejects a name one character over the maximum", () => {
    const name = "x".repeat(SERVICE_LIMITS.name.max + 1);
    expect(
      validateService({ ...validDraft, name }, { categories }).name,
    ).toMatch(/or fewer/);
  });
});

describe("validateService — category", () => {
  it("requires a category", () => {
    expect(
      validateService({ ...validDraft, category: "" }, { categories }).category,
    ).toBe("Category is required.");
  });

  it("rejects a category that is not in the allowed list", () => {
    expect(
      validateService({ ...validDraft, category: "cat_ghost" }, { categories })
        .category,
    ).toBe("Choose a valid category.");
  });

  it("accepts plain-string category entries", () => {
    expect(
      validateService(
        { ...validDraft, category: "web" },
        { categories: ["web", "design"] },
      ).category,
    ).toBeUndefined();
  });
});

describe("validateService — cost", () => {
  it("requires a cost", () => {
    expect(
      validateService({ ...validDraft, cost: "" }, { categories }).cost,
    ).toBe("Cost is required.");
  });

  it("rejects null / undefined cost", () => {
    expect(
      validateService({ ...validDraft, cost: null }, { categories }).cost,
    ).toBe("Cost is required.");
    expect(
      validateService({ ...validDraft, cost: undefined }, { categories }).cost,
    ).toBe("Cost is required.");
  });

  it("rejects non-numeric cost", () => {
    expect(
      validateService({ ...validDraft, cost: "abc" }, { categories }).cost,
    ).toBe("Cost must be a number.");
  });

  it("rejects negative cost", () => {
    expect(
      validateService({ ...validDraft, cost: "-1" }, { categories }).cost,
    ).toBe("Cost cannot be negative.");
  });

  it("rejects cost above the maximum", () => {
    expect(
      validateService(
        { ...validDraft, cost: SERVICE_LIMITS.cost.max + 1 },
        { categories },
      ).cost,
    ).toMatch(/cannot exceed/);
  });
});

describe("validateService — billingCycle", () => {
  it("requires a billing cycle", () => {
    expect(
      validateService({ ...validDraft, billingCycle: "" }, { categories })
        .billingCycle,
    ).toBe("Billing cycle is required.");
  });

  it("rejects an unknown billing cycle", () => {
    expect(
      validateService({ ...validDraft, billingCycle: "biweekly" }, { categories })
        .billingCycle,
    ).toBe("Invalid billing cycle.");
  });

  it.each(["monthly", "quarterly", "yearly", "one_time"])(
    "accepts '%s'",
    (cycle) => {
      expect(
        validateService({ ...validDraft, billingCycle: cycle }, { categories })
          .billingCycle,
      ).toBeUndefined();
    },
  );
});

describe("validateService — renewalDate", () => {
  it("requires a renewal date", () => {
    expect(
      validateService({ ...validDraft, renewalDate: "" }, { categories })
        .renewalDate,
    ).toBe("Renewal date is required.");
  });

  it("accepts a valid ISO date", () => {
    expect(
      validateService({ ...validDraft, renewalDate: "2030-12-31" }, { categories })
        .renewalDate,
    ).toBeUndefined();
  });

  it("rejects a non-ISO format", () => {
    expect(
      validateService(
        { ...validDraft, renewalDate: "31/12/2030" },
        { categories },
      ).renewalDate,
    ).toMatch(/valid date/);
  });

  it("rejects an impossible calendar date", () => {
    expect(
      validateService(
        { ...validDraft, renewalDate: "2030-02-30" },
        { categories },
      ).renewalDate,
    ).toMatch(/valid date/);
  });

  it("rejects an out-of-range month", () => {
    expect(
      validateService(
        { ...validDraft, renewalDate: "2030-13-01" },
        { categories },
      ).renewalDate,
    ).toMatch(/valid date/);
  });

  it("rejects a non-string value", () => {
    expect(
      validateService({ ...validDraft, renewalDate: 20301231 }, { categories })
        .renewalDate,
    ).toMatch(/valid date/);
  });
});

describe("validateService — status", () => {
  it("requires a status", () => {
    expect(
      validateService({ ...validDraft, status: "" }, { categories }).status,
    ).toBe("Status is required.");
  });

  it("rejects an unknown status", () => {
    expect(
      validateService({ ...validDraft, status: "archived" }, { categories })
        .status,
    ).toBe("Invalid status.");
  });

  it("accepts 'inactive'", () => {
    expect(
      validateService({ ...validDraft, status: "inactive" }, { categories })
        .status,
    ).toBeUndefined();
  });
});

describe("validateService — notes", () => {
  it("is optional", () => {
    expect(
      validateService({ ...validDraft, notes: "" }, { categories }).notes,
    ).toBeUndefined();
  });

  it("accepts notes exactly at the limit", () => {
    const notes = "d".repeat(SERVICE_LIMITS.notes.max);
    expect(
      validateService({ ...validDraft, notes }, { categories }).notes,
    ).toBeUndefined();
  });

  it("rejects notes one character over the limit", () => {
    const notes = "d".repeat(SERVICE_LIMITS.notes.max + 1);
    expect(
      validateService({ ...validDraft, notes }, { categories }).notes,
    ).toMatch(/or fewer/);
  });
});

describe("validateService — robustness", () => {
  it("does not throw on an empty object", () => {
    const errors = validateService();
    expect(errors.name).toBeDefined();
    expect(errors.category).toBeDefined();
    expect(errors.cost).toBeDefined();
    expect(errors.billingCycle).toBeDefined();
    expect(errors.renewalDate).toBeDefined();
    expect(errors.status).toBeDefined();
  });

  it("reports every invalid field at once", () => {
    const errors = validateService(
      {
        name: "",
        category: "",
        cost: "x",
        billingCycle: "nope",
        renewalDate: "bad",
        status: "nope",
        notes: "",
      },
      { categories },
    );
    expect(Object.keys(errors).sort()).toEqual([
      "billingCycle",
      "category",
      "cost",
      "name",
      "renewalDate",
      "status",
    ]);
  });
});

describe("validateCategory", () => {
  it("accepts a fresh, unique name", () => {
    expect(validateCategory({ name: "Marketing" }, { categories })).toEqual({});
  });

  it("requires a name", () => {
    expect(validateCategory({ name: "  " }, { categories }).name).toBe(
      "Category name is required.",
    );
  });

  it("enforces the minimum length", () => {
    expect(validateCategory({ name: "a" }, { categories }).name).toMatch(
      /at least/,
    );
  });

  it("enforces the maximum length", () => {
    const name = "z".repeat(CATEGORY_LIMITS.name.max + 1);
    expect(validateCategory({ name }, { categories }).name).toMatch(/or fewer/);
  });

  it("rejects a duplicate name, case-insensitively", () => {
    expect(validateCategory({ name: "  web  " }, { categories }).name).toBe(
      "A category with that name already exists.",
    );
  });

  it("allows keeping the same name when editing (currentId excluded)", () => {
    expect(
      validateCategory({ name: "Web" }, { categories, currentId: "cat_web" }),
    ).toEqual({});
  });
});
