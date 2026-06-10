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

dotenv.config();

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL ?? "http://localhost:3000" }));
app.use(express.json());

app.use("/auth", authRouter);
app.use("/materials", materialsRouter);
app.use("/stock-movements", stockRouter);
app.use("/finished-goods", finishedGoodsRouter);
app.use("/audit-logs", auditRouter);
app.use("/analytics", analyticsRouter);

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.use(errorHandler);

const PORT = process.env.PORT ?? 4000;
app.listen(PORT, () => console.log(`CraftStock API running on port ${PORT}`));

export default app;
