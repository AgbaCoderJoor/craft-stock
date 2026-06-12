import { prisma } from "../../config/db";
import { AppError } from "../../utils/errors";
import { logAudit } from "../../middleware/audit.middleware";

export const getAllMaterials = async (business_id: number) => {
  return prisma.material.findMany({ where: { business_id }, orderBy: { created_at: "desc" } });
};

export const getMaterialById = async (id: number, business_id: number) => {
  const material = await prisma.material.findFirst({ where: { material_id: id, business_id } });
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
}, user_id: number, business_id: number) => {
  const material = await prisma.material.create({ data: { ...data, business_id } });
  await logAudit(business_id, user_id, "CREATE", "Material", material.material_id, null, material as unknown as object);
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
  user_id: number,
  business_id: number
) => {
  const existing = await getMaterialById(id, business_id);
  const updated = await prisma.material.update({ where: { material_id: id }, data });
  await logAudit(business_id, user_id, "UPDATE", "Material", id, existing as unknown as object, updated as unknown as object);
  return updated;
};

export const deleteMaterial = async (id: number, user_id: number, business_id: number) => {
  const existing = await getMaterialById(id, business_id);
  await prisma.material.delete({ where: { material_id: id } });
  await logAudit(business_id, user_id, "DELETE", "Material", id, existing as unknown as object, null);
};

export const getLowStockMaterials = async (business_id: number) => {
  const all = await prisma.material.findMany({ where: { business_id } });
  return all.filter((m) => Number(m.quantity_available) <= Number(m.minimum_stock));
};
