import { Response, NextFunction } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import {
  getMovementsTrend,
  getInventoryByCategory,
  getTopMaterials,
  getMovementDistribution,
  getFinishedGoodsSummary,
} from "./analytics.service";

export const movementsTrend = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const days = Math.min(Number(req.query.days) || 30, 365);
    res.json(await getMovementsTrend(days));
  } catch (err) {
    next(err);
  }
};

export const inventoryByCategory = async (_req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.json(await getInventoryByCategory());
  } catch (err) {
    next(err);
  }
};

export const topMaterials = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const limit = Math.min(Number(req.query.limit) || 10, 20);
    res.json(await getTopMaterials(limit));
  } catch (err) {
    next(err);
  }
};

export const movementDistribution = async (_req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.json(await getMovementDistribution());
  } catch (err) {
    next(err);
  }
};

export const finishedGoodsSummary = async (_req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.json(await getFinishedGoodsSummary());
  } catch (err) {
    next(err);
  }
};
