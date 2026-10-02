const express = require("express");
const authenticate = require("../middleware/authenticate");
const { getSettings, putSettings } = require("../controllers/settingsController");

const router = express.Router();

router.use(authenticate);
router.get("/", getSettings);
router.put("/", putSettings);

module.exports = router;
