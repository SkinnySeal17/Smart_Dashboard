const express = require("express");
const authenticate = require("../middleware/authenticate");
const { loginRateLimit } = require("../middleware/loginRateLimit");
const { register, login, me, logout } = require("../controllers/authController");

const router = express.Router();

router.post("/register", register);
router.post("/login", loginRateLimit, login);
router.get("/me", authenticate, me);
router.post("/logout", authenticate, logout);

module.exports = router;
