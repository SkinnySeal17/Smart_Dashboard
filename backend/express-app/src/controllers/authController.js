const { registerUser, loginUser, getCurrentUser } = require("../services/authService");

async function register(req, res) {
  try {
    const user = await registerUser(req.body);
    return res.status(201).json({ user });
  } catch (error) {
    if (error.code === "VALIDATION_ERROR") {
      return res.status(400).json({
        message: "Invalid registration details.",
        errors: error.errors,
      });
    }
    if (error.code === "DUPLICATE_EMAIL") {
      return res.status(409).json({
        message: "An account with this email already exists.",
      });
    }
    return res.status(500).json({ message: "Registration failed." });
  }
}

async function login(req, res) {
  try {
    const result = await loginUser(req.body);
    return res.status(200).json(result);
  } catch (error) {
    if (error.code === "VALIDATION_ERROR") {
      return res.status(400).json({
        message: "Invalid login details.",
        errors: error.errors,
      });
    }
    if (error.code === "INVALID_CREDENTIALS") {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }
    return res.status(500).json({ message: "Login failed." });
  }
}

async function me(req, res) {
  try {
    const user = await getCurrentUser(req.user.id);
    return res.status(200).json({ user });
  } catch (error) {
    if (error.code === "USER_NOT_FOUND") {
      return res.status(401).json({ message: "Invalid or expired token." });
    }
    return res.status(500).json({ message: "Could not load the current user." });
  }
}

function logout(_req, res) {
  return res.status(200).json({
    message: "Logged out. Discard this token on the client.",
  });
}

module.exports = {
  register,
  login,
  me,
  logout,
};
