import { prisma } from "../config/db";

export const logAudit = async (
  business_id: number,
  user_id: number,
  action: string,
  table_name: string,
  record_id: number,
  old_value?: object | null,
  new_value?: object | null
): Promise<void> => {
  await prisma.auditLog.create({
    data: {
      business_id,
      user_id,
      action,
      table_name,
      record_id,
      old_value: old_value ?? undefined,
      new_value: new_value ?? undefined,
    },
  });
};
