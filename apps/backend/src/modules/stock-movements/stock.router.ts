import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/rbac.middleware";
import { list, create, approve, confirm } from "./stock.controller";

const router = Router();

router.get("/", authenticate, list);
router.post("/", authenticate, authorize("admin", "store_manager", "production_staff"), create);
router.patch("/:id/approve", authenticate, authorize("admin", "store_manager"), approve);
router.patch("/:id/confirm", authenticate, authorize("admin", "store_manager"), confirm);

export default router;
