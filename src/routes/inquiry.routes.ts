import { Router } from "express";
import { inquiryController } from "../controllers/inquiry.controller";
import { validate } from "../middlewares/validate.middleware";
import { requireAuth } from "../middlewares/auth.middleware";
import { inquiryLimiter } from "../middlewares/rateLimiters";
import { createInquirySchema } from "../validators/inquiry.validator";

const router = Router();

router.post(
  "/",
  requireAuth,
  inquiryLimiter,
  validate(createInquirySchema),
  inquiryController.create,
);
router.get("/my", requireAuth, inquiryController.getMine);

export default router;
