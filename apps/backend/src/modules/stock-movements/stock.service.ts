import { MovementType } from "@prisma/client";
import { prisma } from "../../config/db";
import { AppError } from "../../utils/errors";
import { logAudit } from "../../middleware/audit.middleware";

export const getAllMovements = async (page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  const [movements, total] = await Promise.all([
    prisma.stockMovement.findMany({
      skip,
      take: limit,
      orderBy: { movement_date: "desc" },
      include: {
        material: { select: { name: true } },
        finished: { select: { name: true, sku: true } },
        issuer: { select: { name: true } },
        approver: { select: { name: true } },
        confirmer: { select: { name: true } },
      },
    }),
    prisma.stockMovement.count(),
  ]);
  return { movements, total, page, limit };
};

export const createMovement = async (
  data: {
    material_id?: number;
    finished_id?: number;
    movement_type: MovementType;
    quantity: number;
    purpose?: string;
  },
  issued_by: number
) => {
  if (!data.material_id && !data.finished_id) {
    throw new AppError(400, "Either material_id or finished_id is required");
  }
  const movement = await prisma.stockMovement.create({
    data: { ...data, issued_by },
  });
  await logAudit(issued_by, "CREATE", "StockMovement", movement.movement_id, null, movement as unknown as object);
  return movement;
};

export const approveMovement = async (id: number, approved_by: number, approver_role: string) => {
  const existing = await prisma.stockMovement.findUnique({ where: { movement_id: id } });
  if (!existing) throw new AppError(404, "Movement not found");
  if (["IN", "OUT"].includes(existing.movement_type) && approver_role !== "admin") {
    throw new AppError(403, "Only admin can approve IN and OUT movements");
  }
  const updated = await prisma.stockMovement.update({
    where: { movement_id: id },
    data: { approved_by },
  });
  await logAudit(approved_by, "APPROVE", "StockMovement", id, existing as unknown as object, updated as unknown as object);
  return updated;
};

export const confirmMovement = async (id: number, confirmed_by: number) => {
  const existing = await prisma.stockMovement.findUnique({ where: { movement_id: id } });
  if (!existing) throw new AppError(404, "Movement not found");
  const updated = await prisma.stockMovement.update({
    where: { movement_id: id },
    data: { confirmed_by },
  });
  await logAudit(confirmed_by, "CONFIRM", "StockMovement", id, existing as unknown as object, updated as unknown as object);
  return updated;
};
