import { Router } from "express";
import { uploadController } from "../controllers/upload.controller";
import { requireAuth } from "../middlewares/auth.middleware";

const router = Router();

router.post("/signature", requireAuth, uploadController.getSignature);

export default router;
