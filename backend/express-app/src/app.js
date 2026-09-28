const express = require("express");
const authRoutes = require("./routes/authRoutes");

const app = express();

app.use(express.json());
app.use("/api/auth", authRoutes);

app.use((error, _req, res, _next) => {
  if (error instanceof SyntaxError && error.status === 400) {
    return res.status(400).json({ message: "Request body must be valid JSON." });
  }
  return res.status(500).json({ message: "Something went wrong." });
});

module.exports = app;
