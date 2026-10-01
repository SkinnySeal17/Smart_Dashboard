import { env } from "../config/env.js";

// Express 5 forwards errors thrown in async handlers here automatically.
// The 4-argument signature is what marks this as an error handler.
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  res.status(status).json({
    message: err.message || "Internal server error",
    ...(env.nodeEnv === "development" && { stack: err.stack }),
  });
}
