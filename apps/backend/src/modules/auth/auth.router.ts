import { Router } from "express";
import { login, register, getUsers, removeUser, getMe, logout } from "./auth.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/rbac.middleware";

const router = Router();

router.post("/login", login);
router.post("/register", authenticate, authorize("admin"), register);
router.get("/users", authenticate, authorize("admin"), getUsers);
router.delete("/users/:id", authenticate, authorize("admin"), removeUser);
router.get("/me", authenticate, getMe);
router.post("/logout", authenticate, logout);

export default router;
