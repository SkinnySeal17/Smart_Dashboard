const { getCurrentUser, updateProfile, changePassword } = require("../services/authService");

async function getProfile(req, res) {
  try {
    const user = await getCurrentUser(req.user.id);
    return res.status(200).json({ user });
  } catch (error) {
    if (error.code === "USER_NOT_FOUND") {
      return res.status(401).json({ message: "Invalid or expired token." });
    }
    return res.status(500).json({ message: "Could not load profile." });
  }
}

async function putProfile(req, res) {
  try {
    const user = await updateProfile(req.user.id, req.body);
    return res.status(200).json({ user });
  } catch (error) {
    if (error.code === "VALIDATION_ERROR") {
      return res.status(400).json({
        message: "Invalid profile details.",
        errors: error.errors,
      });
    }
    if (error.code === "DUPLICATE_EMAIL") {
      return res.status(409).json({
        message: "An account with this email already exists.",
      });
    }
    if (error.code === "USER_NOT_FOUND") {
      return res.status(401).json({ message: "Invalid or expired token." });
    }
    return res.status(500).json({ message: "Could not update profile." });
  }
}

async function putPassword(req, res) {
  try {
    const result = await changePassword(req.user.id, req.body);
    return res.status(200).json(result);
  } catch (error) {
    if (error.code === "VALIDATION_ERROR") {
      return res.status(400).json({
        message: "Invalid password details.",
        errors: error.errors,
      });
    }
    if (error.code === "INVALID_PASSWORD") {
      return res.status(401).json({ message: "Current password is incorrect." });
    }
    if (error.code === "USER_NOT_FOUND") {
      return res.status(401).json({ message: "Invalid or expired token." });
    }
    return res.status(500).json({ message: "Could not update password." });
  }
}

module.exports = {
  getProfile,
  putProfile,
  putPassword,
};
