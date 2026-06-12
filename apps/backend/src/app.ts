import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRouter from "./modules/auth/auth.router";
import materialsRouter from "./modules/materials/materials.router";
import stockRouter from "./modules/stock-movements/stock.router";
import finishedGoodsRouter from "./modules/finished-goods/finished-goods.router";
import auditRouter from "./modules/audit-logs/audit.router";
import analyticsRouter from "./modules/analytics/analytics.router";
import { errorHandler } from "./utils/errors";
import { prisma } from "./config/db";

dotenv.config();

const app = express();

// Render terminates TLS at a proxy; needed for rate limiting to see client IPs
app.set("trust proxy", 1);

// FRONTEND_URL accepts a comma-separated list of allowed origins
const allowedOrigins = (process.env.FRONTEND_URL ?? "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

app.use("/auth", authRouter);
app.use("/materials", materialsRouter);
app.use("/stock-movements", stockRouter);
app.use("/finished-goods", finishedGoodsRouter);
app.use("/audit-logs", auditRouter);
app.use("/analytics", analyticsRouter);

app.get("/health", (_req, res) => res.json({ status: "ok" }));

// Purges businesses that never verified their email. Render free tier has no
// cron, so a scheduled GitHub Action calls this daily with the shared secret.
app.post("/internal/cleanup-unverified", async (req, res, next) => {
  try {
    if (!process.env.CRON_SECRET || req.headers["x-cron-secret"] !== process.env.CRON_SECRET) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const result = await prisma.business.deleteMany({
      where: { status: "pending", created_at: { lt: cutoff } },
    });
    res.json({ deleted: result.count });
  } catch (err) {
    next(err);
  }
});

app.use(errorHandler);

const PORT = process.env.PORT ?? 4000;
app.listen(PORT, () => console.log(`CraftStock API running on port ${PORT}`));

export default app;
