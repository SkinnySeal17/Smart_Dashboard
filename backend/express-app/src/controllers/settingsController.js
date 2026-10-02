const {
  findSettingsByUserId,
  updateSettings,
  toPublicSettings,
} = require("../services/userSettingsRepository");

async function getSettings(req, res) {
  try {
    const settings = toPublicSettings(await findSettingsByUserId(req.user.id));
    if (!settings) {
      return res.status(404).json({ message: "Settings not found." });
    }
    return res.status(200).json({ settings });
  } catch (_error) {
    return res.status(500).json({ message: "Could not load settings." });
  }
}

async function putSettings(req, res) {
  try {
    const settings = toPublicSettings(await updateSettings(req.user.id, req.body));
    if (!settings) {
      return res.status(404).json({ message: "Settings not found." });
    }
    return res.status(200).json({ settings });
  } catch (error) {
    if (error.code === "VALIDATION_ERROR") {
      return res.status(400).json({
        message: "Invalid settings.",
        errors: error.errors,
      });
    }
    return res.status(500).json({ message: "Could not update settings." });
  }
}

module.exports = {
  getSettings,
  putSettings,
};
