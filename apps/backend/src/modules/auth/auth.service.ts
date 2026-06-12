import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../../config/db";
import { AppError } from "../../utils/errors";
import { logAudit } from "../../middleware/audit.middleware";
import { createAuthToken, consumeAuthToken } from "../../utils/tokens";
import { sendVerificationEmail, sendPasswordResetEmail, emailEnabled } from "../../utils/email";

const slugify = (name: string): string =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

// dev_link lets the flows be exercised end-to-end before email sending is
// configured; it is never exposed in production.
const devLink = (link: string): string | undefined =>
  !emailEnabled() && process.env.NODE_ENV !== "production" ? link : undefined;

export const loginUser = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { role: true, business: true },
  });

  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    throw new AppError(401, "Invalid credentials");
  }

  if (!user.email_verified) {
    throw new AppError(403, "Please verify your email before signing in");
  }

  if (user.business.status !== "active") {
    throw new AppError(403, "This business account is not active");
  }

  const token = jwt.sign(
    { user_id: user.user_id, role: user.role.role_name, email: user.email, business_id: user.business_id },
    process.env.JWT_SECRET!,
    { expiresIn: "24h" }
  );

  return {
    token,
    user: {
      user_id: user.user_id,
      name: user.name,
      email: user.email,
      role: user.role.role_name,
      business: { business_id: user.business.business_id, name: user.business.name },
    },
  };
};

export const registerUser = async (
  data: {
    name: string;
    email: string;
    password: string;
    role_name: string;
  },
  business_id: number
) => {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) throw new AppError(409, "Email already in use");

  const role = await prisma.role.findUnique({ where: { role_name: data.role_name } });
  if (!role) throw new AppError(400, `Role '${data.role_name}' does not exist`);

  const password_hash = await bcrypt.hash(data.password, 10);
  // Staff created by an admin are trusted — no email verification round-trip
  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password_hash,
      role_id: role.role_id,
      business_id,
      email_verified: true,
    },
    include: { role: true },
  });

  return { user_id: user.user_id, name: user.name, email: user.email, role: user.role.role_name };
};

export const listUsers = async (business_id: number) => {
  return prisma.user.findMany({
    where: { business_id },
    select: { user_id: true, name: true, email: true, role: { select: { role_name: true } }, created_at: true },
    orderBy: { created_at: "desc" },
  });
};

export const deleteUser = async (id: number, business_id: number, requesting_user_id: number) => {
  if (id === requesting_user_id) throw new AppError(400, "Cannot delete your own account");
  const user = await prisma.user.findFirst({ where: { user_id: id, business_id } });
  if (!user) throw new AppError(404, "User not found");
  await prisma.user.delete({ where: { user_id: id } });
};

export const changeUserPassword = async (
  id: number,
  newPassword: string,
  business_id: number,
  requesting_user_id: number
): Promise<void> => {
  const user = await prisma.user.findFirst({ where: { user_id: id, business_id } });
  if (!user) throw new AppError(404, "User not found");

  const password_hash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { user_id: id }, data: { password_hash } });

  // never log password values — record only that the change happened
  await logAudit(business_id, requesting_user_id, "CHANGE_PASSWORD", "User", id, null, null);
};

export const getCurrentUser = async (user_id: number) => {
  const user = await prisma.user.findUnique({
    where: { user_id },
    select: {
      user_id: true,
      name: true,
      email: true,
      created_at: true,
      role: { select: { role_name: true } },
      business: { select: { business_id: true, name: true } },
    },
  });
  if (!user) throw new AppError(404, "User not found");
  return {
    user_id: user.user_id,
    name: user.name,
    email: user.email,
    role: user.role.role_name,
    created_at: user.created_at,
    business: user.business,
  };
};

export const logoutUser = async (user_id: number, business_id: number): Promise<void> => {
  await logAudit(business_id, user_id, "LOGOUT", "User", user_id, null, null);
};

// --- Self-service onboarding ---

// TODO: add CAPTCHA (Cloudflare Turnstile) before opening signup to heavy traffic
export const signupBusiness = async (data: {
  business_name: string;
  name: string;
  email: string;
  password: string;
}) => {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) throw new AppError(409, "Email already in use");

  const adminRole = await prisma.role.findUnique({ where: { role_name: "admin" } });
  if (!adminRole) throw new AppError(500, "Roles are not seeded");

  const base = slugify(data.business_name) || "business";
  let slug = base;
  for (let i = 2; await prisma.business.findUnique({ where: { slug } }); i++) {
    slug = `${base}-${i}`;
  }

  const password_hash = await bcrypt.hash(data.password, 10);
  const { business, user } = await prisma.$transaction(async (tx) => {
    const business = await tx.business.create({
      data: { name: data.business_name, slug, status: "pending" },
    });
    const user = await tx.user.create({
      data: {
        name: data.name,
        email: data.email,
        password_hash,
        role_id: adminRole.role_id,
        business_id: business.business_id,
        email_verified: false,
      },
    });
    return { business, user };
  });

  await logAudit(business.business_id, user.user_id, "SIGNUP", "Business", business.business_id, null, {
    name: business.name,
    slug: business.slug,
  });

  const token = await createAuthToken(user.user_id, "EMAIL_VERIFICATION");
  const link = await sendVerificationEmail(user.email, business.name, token);

  return {
    message: "Account created — check your email to verify your account",
    dev_link: devLink(link),
  };
};

export const verifyEmail = async (rawToken: string) => {
  const user_id = await consumeAuthToken(rawToken, "EMAIL_VERIFICATION");

  const user = await prisma.user.findUnique({ where: { user_id } });
  if (!user) throw new AppError(400, "This link is invalid or has expired");

  await prisma.$transaction([
    prisma.user.update({ where: { user_id }, data: { email_verified: true } }),
    prisma.business.updateMany({
      where: { business_id: user.business_id, status: "pending" },
      data: { status: "active" },
    }),
  ]);

  return { message: "Email verified — you can now sign in" };
};

const GENERIC_TOKEN_RESPONSE = { message: "If that account exists, a link has been sent to its email" };

export const resendVerification = async (email: string) => {
  const user = await prisma.user.findUnique({ where: { email }, include: { business: true } });
  if (!user || user.email_verified) return GENERIC_TOKEN_RESPONSE;

  const token = await createAuthToken(user.user_id, "EMAIL_VERIFICATION");
  const link = await sendVerificationEmail(user.email, user.business.name, token);
  return { ...GENERIC_TOKEN_RESPONSE, dev_link: devLink(link) };
};

export const forgotPassword = async (email: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return GENERIC_TOKEN_RESPONSE;

  const token = await createAuthToken(user.user_id, "PASSWORD_RESET");
  const link = await sendPasswordResetEmail(user.email, token);
  return { ...GENERIC_TOKEN_RESPONSE, dev_link: devLink(link) };
};

export const resetPassword = async (rawToken: string, newPassword: string) => {
  const user_id = await consumeAuthToken(rawToken, "PASSWORD_RESET");

  const user = await prisma.user.findUnique({ where: { user_id } });
  if (!user) throw new AppError(400, "This link is invalid or has expired");

  const password_hash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { user_id }, data: { password_hash } });

  // never log password values — record only that the change happened
  await logAudit(user.business_id, user_id, "RESET_PASSWORD", "User", user_id, null, null);

  return { message: "Password updated — you can now sign in" };
};
