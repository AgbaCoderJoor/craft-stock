import { prisma } from "../../config/db";
import { AppError } from "../../utils/errors";
import { logAudit } from "../../middleware/audit.middleware";

export const getAllFinishedGoods = async () => {
  return prisma.finishedGood.findMany({ orderBy: { created_at: "desc" } });
};

export const getFinishedGoodById = async (id: number) => {
  const good = await prisma.finishedGood.findUnique({ where: { finished_id: id } });
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
  user_id: number
) => {
  const good = await prisma.finishedGood.create({ data });
  await logAudit(user_id, "CREATE", "FinishedGood", good.finished_id, null, good as unknown as object);
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
  user_id: number
) => {
  const existing = await getFinishedGoodById(id);
  const updated = await prisma.finishedGood.update({ where: { finished_id: id }, data });
  await logAudit(user_id, "UPDATE", "FinishedGood", id, existing as unknown as object, updated as unknown as object);
  return updated;
};
