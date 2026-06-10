import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/rbac.middleware";
import { list, getOne, create, update } from "./finished-goods.controller";

const router = Router();

router.get("/", authenticate, list);
router.get("/:id", authenticate, getOne);
router.post("/", authenticate, authorize("admin", "production_staff"), create);
router.patch("/:id", authenticate, authorize("admin", "store_manager"), update);

export default router;
