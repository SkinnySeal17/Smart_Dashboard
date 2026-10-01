// Central place to read environment variables (loaded from .env by the npm scripts).
export const env = {
  port: Number(process.env.PORT) || 5000,
  nodeEnv: process.env.NODE_ENV || "development",
  mongodbUri: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/smart_dashboard",
  corsOrigin: (process.env.CORS_ORIGIN || "http://localhost:5173").split(","),
};
