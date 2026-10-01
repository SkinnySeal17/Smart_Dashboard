import express from "express";
import cors from "cors";
import morgan from "morgan";
import { env } from "./config/env.js";
import accountsRoutes from "./modules/accounts/accounts.routes.js";
import servicesRoutes from "./modules/services/services.routes.js";
import dashboardRoutes from "./modules/dashboard/dashboard.routes.js";
import { notFound } from "./middleware/notFound.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.use(cors({ origin: env.corsOrigin }));
app.use(express.json());
if (env.nodeEnv !== "test") app.use(morgan("dev"));

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.use("/api/accounts", accountsRoutes);
app.use("/api/services", servicesRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
