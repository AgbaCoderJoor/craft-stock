import { prisma } from "../../config/db";

export const getAllAuditLogs = async (business_id: number, page = 1, limit = 50) => {
  const skip = (page - 1) * limit;
  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where: { business_id },
      skip,
      take: limit,
      orderBy: { created_at: "desc" },
      include: { user: { select: { name: true, email: true } } },
    }),
    prisma.auditLog.count({ where: { business_id } }),
  ]);
  return { logs, total, page, limit };
};
