import crypto from "crypto";
import { TokenType } from "@prisma/client";
import { prisma } from "../config/db";
import { AppError } from "./errors";

const EXPIRY_HOURS: Record<TokenType, number> = {
  EMAIL_VERIFICATION: 24,
  PASSWORD_RESET: 1,
};

const hashToken = (raw: string) => crypto.createHash("sha256").update(raw).digest("hex");

// Returns the raw token for the emailed link; only its hash is stored.
// Any previous unused tokens of the same type are invalidated.
export const createAuthToken = async (user_id: number, type: TokenType): Promise<string> => {
  const raw = crypto.randomBytes(32).toString("hex");
  const expires_at = new Date(Date.now() + EXPIRY_HOURS[type] * 60 * 60 * 1000);

  await prisma.$transaction([
    prisma.authToken.updateMany({
      where: { user_id, type, used_at: null },
      data: { used_at: new Date() },
    }),
    prisma.authToken.create({
      data: { user_id, type, token_hash: hashToken(raw), expires_at },
    }),
  ]);

  return raw;
};

// Validates and burns the token; returns its user_id.
export const consumeAuthToken = async (raw: string, type: TokenType): Promise<number> => {
  const token = await prisma.authToken.findUnique({ where: { token_hash: hashToken(raw) } });

  if (!token || token.type !== type || token.used_at || token.expires_at < new Date()) {
    throw new AppError(400, "This link is invalid or has expired");
  }

  await prisma.authToken.update({
    where: { token_id: token.token_id },
    data: { used_at: new Date() },
  });

  return token.user_id;
};
