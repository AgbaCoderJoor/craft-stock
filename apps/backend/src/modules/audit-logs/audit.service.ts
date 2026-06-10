import { prisma } from "../../config/db";

export const getAllAuditLogs = async (page = 1, limit = 50) => {
  const skip = (page - 1) * limit;
  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      skip,
      take: limit,
      orderBy: { created_at: "desc" },
      include: { user: { select: { name: true, email: true } } },
    }),
    prisma.auditLog.count(),
  ]);
  return { logs, total, page, limit };
};
