import { Response, NextFunction } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import { getAllAuditLogs } from "./audit.service";

export const list = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 50;
    res.json(await getAllAuditLogs(page, limit));
  } catch (err) {
    next(err);
  }
};
