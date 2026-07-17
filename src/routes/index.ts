import { Router } from "express";
import authRoutes from "./auth.routes";
import propertyRoutes from "./property.routes";
import inquiryRoutes from "./inquiry.routes";
import uploadRoutes from "./upload.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/properties", propertyRoutes);
router.use("/inquiries", inquiryRoutes);
router.use("/upload", uploadRoutes);

export default router;
