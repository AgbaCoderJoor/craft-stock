import rateLimit from "express-rate-limit";

// Applied to credential and token endpoints. Render sits behind a proxy, so
// app.set("trust proxy", 1) in app.ts is required for per-client keying.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many attempts — please try again later" },
});
