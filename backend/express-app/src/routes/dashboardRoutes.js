const express = require("express");
const authenticate = require("../middleware/authenticate");
const controller = require("../controllers/dashboardController");

// GET /api/dashboard                    everything below in one response (used by the dashboard page)
// GET /api/dashboard/summary            counts, monthly + yearly spend, next renewal
// GET /api/dashboard/spend-by-category  monthly spend per category, biggest first
// GET /api/dashboard/renewals?days=7    upcoming (within N days) and overdue renewals
const router = express.Router();

router.use(authenticate);

router.get("/", controller.getOverview);
router.get("/summary", controller.getSummary);
router.get("/spend-by-category", controller.getSpendByCategory);
router.get("/renewals", controller.getRenewals);

module.exports = router;
