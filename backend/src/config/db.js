import mongoose from "mongoose";
import { env } from "./env.js";

export async function connectDB() {
  // Fail fast (default is 30s) so a missing database is obvious on startup.
  await mongoose.connect(env.mongodbUri, { serverSelectionTimeoutMS: 5000 });
  console.log(`MongoDB connected: ${mongoose.connection.host}`);
}
