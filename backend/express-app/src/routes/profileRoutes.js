const express = require("express");
const authenticate = require("../middleware/authenticate");
const { getProfile, putProfile, putPassword } = require("../controllers/profileController");

const router = express.Router();

router.use(authenticate);
router.get("/", getProfile);
router.put("/password", putPassword);
router.put("/", putProfile);

module.exports = router;
