import { prisma } from "../../config/db";
import { AppError } from "../../utils/errors";
import { logAudit } from "../../middleware/audit.middleware";

export const getAllFinishedGoods = async (business_id: number) => {
  return prisma.finishedGood.findMany({ where: { business_id }, orderBy: { created_at: "desc" } });
};

export const getFinishedGoodById = async (id: number, business_id: number) => {
  const good = await prisma.finishedGood.findFirst({ where: { finished_id: id, business_id } });
  if (!good) throw new AppError(404, "Finished good not found");
  return good;
};

export const createFinishedGood = async (
  data: {
    name: string;
    sku: string;
    size?: string;
    quantity_produced?: number;
    quantity_sold?: number;
    current_quantity?: number;
    production_date?: Date;
  },
  user_id: number,
  business_id: number
) => {
  const duplicate = await prisma.finishedGood.findFirst({ where: { business_id, sku: data.sku } });
  if (duplicate) throw new AppError(409, "A finished good with this SKU already exists");

  const good = await prisma.finishedGood.create({ data: { ...data, business_id } });
  await logAudit(business_id, user_id, "CREATE", "FinishedGood", good.finished_id, null, good as unknown as object);
  return good;
};

export const updateFinishedGood = async (
  id: number,
  data: Partial<{
    name: string;
    sku: string;
    size: string;
    quantity_produced: number;
    quantity_sold: number;
    current_quantity: number;
    production_date: Date;
  }>,
  user_id: number,
  business_id: number
) => {
  const existing = await getFinishedGoodById(id, business_id);

  if (data.sku && data.sku !== existing.sku) {
    const duplicate = await prisma.finishedGood.findFirst({ where: { business_id, sku: data.sku } });
    if (duplicate) throw new AppError(409, "A finished good with this SKU already exists");
  }

  const updated = await prisma.finishedGood.update({ where: { finished_id: id }, data });
  await logAudit(business_id, user_id, "UPDATE", "FinishedGood", id, existing as unknown as object, updated as unknown as object);
  return updated;
};
