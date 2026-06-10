import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../../config/db";
import { AppError } from "../../utils/errors";
import { logAudit } from "../../middleware/audit.middleware";

export const loginUser = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { role: true },
  });

  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    throw new AppError(401, "Invalid credentials");
  }

  const token = jwt.sign(
    { user_id: user.user_id, role: user.role.role_name, email: user.email },
    process.env.JWT_SECRET!,
    { expiresIn: "24h" }
  );

  return {
    token,
    user: { user_id: user.user_id, name: user.name, email: user.email, role: user.role.role_name },
  };
};

export const registerUser = async (data: {
  name: string;
  email: string;
  password: string;
  role_name: string;
}) => {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) throw new AppError(409, "Email already in use");

  const role = await prisma.role.findUnique({ where: { role_name: data.role_name } });
  if (!role) throw new AppError(400, `Role '${data.role_name}' does not exist`);

  const password_hash = await bcrypt.hash(data.password, 10);
  const user = await prisma.user.create({
    data: { name: data.name, email: data.email, password_hash, role_id: role.role_id },
    include: { role: true },
  });

  return { user_id: user.user_id, name: user.name, email: user.email, role: user.role.role_name };
};

export const listUsers = async () => {
  return prisma.user.findMany({
    select: { user_id: true, name: true, email: true, role: { select: { role_name: true } }, created_at: true },
    orderBy: { created_at: "desc" },
  });
};

export const deleteUser = async (id: number, requesting_user_id: number) => {
  if (id === requesting_user_id) throw new AppError(400, "Cannot delete your own account");
  const user = await prisma.user.findUnique({ where: { user_id: id } });
  if (!user) throw new AppError(404, "User not found");
  await prisma.user.delete({ where: { user_id: id } });
};

export const getCurrentUser = async (user_id: number) => {
  const user = await prisma.user.findUnique({
    where: { user_id },
    select: { user_id: true, name: true, email: true, created_at: true, role: { select: { role_name: true } } },
  });
  if (!user) throw new AppError(404, "User not found");
  return { user_id: user.user_id, name: user.name, email: user.email, role: user.role.role_name, created_at: user.created_at };
};

export const logoutUser = async (user_id: number): Promise<void> => {
  await logAudit(user_id, "LOGOUT", "User", user_id, null, null);
};
