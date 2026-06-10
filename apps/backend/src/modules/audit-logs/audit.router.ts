import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/rbac.middleware";
import { list } from "./audit.controller";

const router = Router();

router.get("/", authenticate, authorize("admin"), list);

export default router;
