import { MovementType } from "@prisma/client";
import { prisma } from "../../config/db";
import { AppError } from "../../utils/errors";
import { logAudit } from "../../middleware/audit.middleware";

export const getAllMovements = async (business_id: number, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  const [movements, total] = await Promise.all([
    prisma.stockMovement.findMany({
      where: { business_id },
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
    prisma.stockMovement.count({ where: { business_id } }),
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
  issued_by: number,
  business_id: number
) => {
  if (!data.material_id && !data.finished_id) {
    throw new AppError(400, "Either material_id or finished_id is required");
  }

  // The referenced item must belong to the caller's business
  if (data.material_id) {
    const material = await prisma.material.findFirst({ where: { material_id: data.material_id, business_id } });
    if (!material) throw new AppError(404, "Material not found");
  }
  if (data.finished_id) {
    const finished = await prisma.finishedGood.findFirst({ where: { finished_id: data.finished_id, business_id } });
    if (!finished) throw new AppError(404, "Finished good not found");
  }

  const movement = await prisma.stockMovement.create({
    data: { ...data, issued_by, business_id },
  });
  await logAudit(business_id, issued_by, "CREATE", "StockMovement", movement.movement_id, null, movement as unknown as object);
  return movement;
};

export const approveMovement = async (id: number, approved_by: number, approver_role: string, business_id: number) => {
  const existing = await prisma.stockMovement.findFirst({ where: { movement_id: id, business_id } });
  if (!existing) throw new AppError(404, "Movement not found");
  if (["IN", "OUT"].includes(existing.movement_type) && approver_role !== "admin") {
    throw new AppError(403, "Only admin can approve IN and OUT movements");
  }
  const updated = await prisma.stockMovement.update({
    where: { movement_id: id },
    data: { approved_by },
  });
  await logAudit(business_id, approved_by, "APPROVE", "StockMovement", id, existing as unknown as object, updated as unknown as object);
  return updated;
};

export const confirmMovement = async (id: number, confirmed_by: number, business_id: number) => {
  const existing = await prisma.stockMovement.findFirst({ where: { movement_id: id, business_id } });
  if (!existing) throw new AppError(404, "Movement not found");
  const updated = await prisma.stockMovement.update({
    where: { movement_id: id },
    data: { confirmed_by },
  });
  await logAudit(business_id, confirmed_by, "CONFIRM", "StockMovement", id, existing as unknown as object, updated as unknown as object);
  return updated;
};
