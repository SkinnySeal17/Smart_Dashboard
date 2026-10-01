const dashboardRepository = require("../services/dashboardRepository");
const {
  DEFAULT_WINDOW_DAYS,
  buildDashboard,
  renewalsOverview,
  spendByCategory,
  summarize,
  todayKey,
} = require("../services/dashboardStats");

const MAX_WINDOW_DAYS = 365;

// `?days=` for the upcoming-renewals window: whole number 1–365, default 7.
// Returns null when the value is invalid.
function parseWindowDays(value) {
  if (value === undefined || value === "") return DEFAULT_WINDOW_DAYS;
  if (typeof value !== "string" || !/^\d+$/.test(value)) return null;
  const days = Number(value);
  return days >= 1 && days <= MAX_WINDOW_DAYS ? days : null;
}

function invalidDays(res) {
  return res.status(400).json({
    message: `"days" must be a whole number between 1 and ${MAX_WINDOW_DAYS}.`,
  });
}

async function loadData(req) {
  const { services, categories } =
    await dashboardRepository.getDashboardData(req.user.id);
  return { services, categories, today: todayKey() };
}

async function getOverview(req, res) {
  try {
    const windowDays = parseWindowDays(req.query.days);
    if (windowDays === null) return invalidDays(res);

    const { services, categories, today } = await loadData(req);
    return res.json(buildDashboard(services, categories, { today, windowDays }));
  } catch (error) {
    return res.status(500).json({ message: "Unable to load dashboard." });
  }
}

async function getSummary(req, res) {
  try {
    const { services, categories, today } = await loadData(req);
    return res.json(summarize(services, categories, today));
  } catch (error) {
    return res.status(500).json({ message: "Unable to load dashboard summary." });
  }
}

async function getSpendByCategory(req, res) {
  try {
    const { services, categories } = await loadData(req);
    return res.json(spendByCategory(services, categories));
  } catch (error) {
    return res.status(500).json({ message: "Unable to load category spending." });
  }
}

async function getRenewals(req, res) {
  try {
    const windowDays = parseWindowDays(req.query.days);
    if (windowDays === null) return invalidDays(res);

    const { services, categories, today } = await loadData(req);
    return res.json(renewalsOverview(services, categories, today, windowDays));
  } catch (error) {
    return res.status(500).json({ message: "Unable to load renewals." });
  }
}

module.exports = {
  MAX_WINDOW_DAYS,
  parseWindowDays,
  getOverview,
  getSummary,
  getSpendByCategory,
  getRenewals,
};
