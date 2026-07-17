import { Router } from "express";
import { inquiryController } from "../controllers/inquiry.controller";
import { validate } from "../middlewares/validate.middleware";
import { requireAuth } from "../middlewares/auth.middleware";
import { inquiryLimiter } from "../middlewares/rateLimiters";
import { createInquirySchema } from "../validators/inquiry.validator";

const router = Router();

/**
 * @openapi
 * /inquiries:
 *   post:
 *     tags: [Inquiries]
 *     summary: Send an inquiry to a property owner
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [propertyId, message]
 *             properties:
 *               propertyId: { type: string, format: uuid }
 *               message: { type: string, example: "Is this property still available?" }
 *     responses:
 *       201: { description: Inquiry sent }
 *       409: { description: Duplicate inquiry for this property }
 *       429: { description: Rate limited / cooldown active }
 */
router.post("/", requireAuth, inquiryLimiter, validate(createInquirySchema), inquiryController.create);

/**
 * @openapi
 * /inquiries/my:
 *   get:
 *     tags: [Inquiries]
 *     summary: Get inquiries sent by the authenticated user
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: List of the user's inquiries }
 */
router.get("/my", requireAuth, inquiryController.getMine);

export default router;
