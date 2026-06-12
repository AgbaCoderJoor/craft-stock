import { Response, NextFunction } from "express";
import { z } from "zod";
import { MovementType } from "@prisma/client";
import { AuthRequest } from "../../middleware/auth.middleware";
import { getAllMovements, createMovement, approveMovement, confirmMovement } from "./stock.service";

const CreateMovementSchema = z.object({
  material_id: z.number().int().positive().optional(),
  finished_id: z.number().int().positive().optional(),
  movement_type: z.nativeEnum(MovementType),
  quantity: z.number().positive(),
  purpose: z.string().optional(),
});

export const list = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const result = await getAllMovements(req.user!.business_id, page, limit);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const create = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = CreateMovementSchema.parse(req.body);
    const movement = await createMovement(data, req.user!.user_id, req.user!.business_id);
    res.status(201).json(movement);
  } catch (err) {
    next(err);
  }
};

export const approve = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const movement = await approveMovement(Number(req.params.id), req.user!.user_id, req.user!.role, req.user!.business_id);
    res.json(movement);
  } catch (err) {
    next(err);
  }
};

export const confirm = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const movement = await confirmMovement(Number(req.params.id), req.user!.user_id, req.user!.business_id);
    res.json(movement);
  } catch (err) {
    next(err);
  }
};
