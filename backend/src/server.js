import app from "./app.js";
import { connectDB } from "./config/db.js";
import { env } from "./config/env.js";

app.listen(env.port, () => {
  console.log(`API running on http://localhost:${env.port}`);
});

// The API still starts without a database so the setup can be checked early;
// routes that use models will fail until MONGODB_URI points to a running MongoDB.
try {
  await connectDB();
} catch (err) {
  console.warn(`MongoDB not connected (${err.message}). Check MONGODB_URI in .env.`);
}
