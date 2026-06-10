import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import {
  movementsTrend,
  inventoryByCategory,
  topMaterials,
  movementDistribution,
  finishedGoodsSummary,
} from "./analytics.controller";

const router = Router();

router.use(authenticate);

router.get("/movements-trend", movementsTrend);
router.get("/inventory-by-category", inventoryByCategory);
router.get("/top-materials", topMaterials);
router.get("/movement-distribution", movementDistribution);
router.get("/finished-goods-summary", finishedGoodsSummary);

export default router;
