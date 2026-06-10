import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/rbac.middleware";
import { list, getOne, create, update, remove, lowStock } from "./materials.controller";

const router = Router();

router.get("/", authenticate, list);
router.get("/low-stock", authenticate, lowStock);
router.get("/:id", authenticate, getOne);
router.post("/", authenticate, authorize("admin", "store_manager"), create);
router.patch("/:id", authenticate, authorize("admin", "store_manager"), update);
router.delete("/:id", authenticate, authorize("admin"), remove);

export default router;
