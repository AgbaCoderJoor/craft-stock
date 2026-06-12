import { Router } from "express";
import {
  login,
  register,
  getUsers,
  removeUser,
  changePassword,
  getMe,
  logout,
  signup,
  verify,
  resend,
  forgot,
  reset,
} from "./auth.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/rbac.middleware";
import { authLimiter } from "../../middleware/ratelimit.middleware";

const router = Router();

router.post("/login", authLimiter, login);
router.post("/signup", authLimiter, signup);
router.post("/verify-email", authLimiter, verify);
router.post("/resend-verification", authLimiter, resend);
router.post("/forgot-password", authLimiter, forgot);
router.post("/reset-password", authLimiter, reset);
router.post("/register", authenticate, authorize("admin"), register);
router.get("/users", authenticate, authorize("admin"), getUsers);
router.delete("/users/:id", authenticate, authorize("admin"), removeUser);
router.patch("/users/:id/password", authenticate, authorize("admin"), changePassword);
router.get("/me", authenticate, getMe);
router.post("/logout", authenticate, logout);

export default router;
