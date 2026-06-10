import { Response, NextFunction } from "express";
import { z } from "zod";
import { AuthRequest } from "../../middleware/auth.middleware";
import { getAllFinishedGoods, getFinishedGoodById, createFinishedGood, updateFinishedGood } from "./finished-goods.service";

const CreateFinishedGoodSchema = z.object({
  name: z.string().min(1),
  sku: z.string().min(1),
  size: z.string().optional(),
  quantity_produced: z.number().int().min(0).optional(),
  quantity_sold: z.number().int().min(0).optional(),
  current_quantity: z.number().int().min(0).optional(),
  production_date: z.string().datetime().optional().transform((v) => (v ? new Date(v) : undefined)),
});

const UpdateFinishedGoodSchema = CreateFinishedGoodSchema.partial();

export const list = async (_req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.json(await getAllFinishedGoods());
  } catch (err) {
    next(err);
  }
};

export const getOne = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.json(await getFinishedGoodById(Number(req.params.id)));
  } catch (err) {
    next(err);
  }
};

export const create = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = CreateFinishedGoodSchema.parse(req.body);
    const good = await createFinishedGood(data as Parameters<typeof createFinishedGood>[0], req.user!.user_id);
    res.status(201).json(good);
  } catch (err) {
    next(err);
  }
};

export const update = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = UpdateFinishedGoodSchema.parse(req.body);
    const good = await updateFinishedGood(Number(req.params.id), data as Parameters<typeof updateFinishedGood>[1], req.user!.user_id);
    res.json(good);
  } catch (err) {
    next(err);
  }
};
