import { Response, NextFunction } from "express";
import { z } from "zod";
import { AuthRequest } from "../../middleware/auth.middleware";
import {
  getAllMaterials,
  getMaterialById,
  createMaterial,
  updateMaterial,
  deleteMaterial,
  getLowStockMaterials,
} from "./materials.service";

const CreateMaterialSchema = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  supplier: z.string().optional(),
  cost_price: z.number().positive(),
  quantity_available: z.number().min(0),
  minimum_stock: z.number().min(0),
  batch_number: z.string().optional(),
});

const UpdateMaterialSchema = CreateMaterialSchema.partial();

export const list = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const materials = await getAllMaterials(req.user!.business_id);
    res.json(materials);
  } catch (err) {
    next(err);
  }
};

export const getOne = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const material = await getMaterialById(Number(req.params.id), req.user!.business_id);
    res.json(material);
  } catch (err) {
    next(err);
  }
};

export const create = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = CreateMaterialSchema.parse(req.body);
    const material = await createMaterial(data, req.user!.user_id, req.user!.business_id);
    res.status(201).json(material);
  } catch (err) {
    next(err);
  }
};

export const update = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = UpdateMaterialSchema.parse(req.body);
    const material = await updateMaterial(Number(req.params.id), data, req.user!.user_id, req.user!.business_id);
    res.json(material);
  } catch (err) {
    next(err);
  }
};

export const remove = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await deleteMaterial(Number(req.params.id), req.user!.user_id, req.user!.business_id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

export const lowStock = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const materials = await getLowStockMaterials(req.user!.business_id);
    res.json(materials);
  } catch (err) {
    next(err);
  }
};
