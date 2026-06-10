import { prisma } from "../../config/db";
import { AppError } from "../../utils/errors";
import { logAudit } from "../../middleware/audit.middleware";

export const getAllMaterials = async () => {
  return prisma.material.findMany({ orderBy: { created_at: "desc" } });
};

export const getMaterialById = async (id: number) => {
  const material = await prisma.material.findUnique({ where: { material_id: id } });
  if (!material) throw new AppError(404, "Material not found");
  return material;
};

export const createMaterial = async (data: {
  name: string;
  category: string;
  supplier?: string;
  cost_price: number;
  quantity_available: number;
  minimum_stock: number;
  batch_number?: string;
}, user_id: number) => {
  const material = await prisma.material.create({ data });
  await logAudit(user_id, "CREATE", "Material", material.material_id, null, material as unknown as object);
  return material;
};

export const updateMaterial = async (
  id: number,
  data: Partial<{
    name: string;
    category: string;
    supplier: string;
    cost_price: number;
    quantity_available: number;
    minimum_stock: number;
    batch_number: string;
  }>,
  user_id: number
) => {
  const existing = await getMaterialById(id);
  const updated = await prisma.material.update({ where: { material_id: id }, data });
  await logAudit(user_id, "UPDATE", "Material", id, existing as unknown as object, updated as unknown as object);
  return updated;
};

export const deleteMaterial = async (id: number, user_id: number) => {
  const existing = await getMaterialById(id);
  await prisma.material.delete({ where: { material_id: id } });
  await logAudit(user_id, "DELETE", "Material", id, existing as unknown as object, null);
};

export const getLowStockMaterials = async () => {
  const all = await prisma.material.findMany();
  return all.filter((m) => Number(m.quantity_available) <= Number(m.minimum_stock));
};
