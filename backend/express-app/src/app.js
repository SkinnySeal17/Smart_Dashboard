const express = require("express");
const authRoutes = require("./routes/authRoutes");
const profileRoutes = require("./routes/profileRoutes");
const settingsRoutes = require("./routes/settingsRoutes");
const { securityHeaders, restrictCors } = require("./middleware/security");

const categoryRoutes = require("./routes/categoryRoutes");
const serviceRoutes = require("./routes/serviceRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");

const app = express();

app.disable("x-powered-by");
app.set("trust proxy", false);
app.use(securityHeaders);
app.use(restrictCors);
app.use(express.json({ limit: "100kb" }));
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.use((error, _req, res, _next) => {
  if (error instanceof SyntaxError && error.status === 400) {
    return res.status(400).json({ message: "Request body must be valid JSON." });
  }
  return res.status(500).json({ message: "Something went wrong." });
});

module.exports = app;
