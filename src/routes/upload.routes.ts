import { Router } from "express";
import { uploadController } from "../controllers/upload.controller";
import { requireAuth } from "../middlewares/auth.middleware";

const router = Router();

/**
 * @openapi
 * /uploads/signature:
 *   post:
 *     tags: [Uploads]
 *     summary: Get a signed Cloudinary upload signature for direct-to-Cloudinary image upload
 *     description: >
 *       The client uses this response to upload image files straight to Cloudinary
 *       (POST https://api.cloudinary.com/v1_1/{cloudName}/image/upload) without the
 *       file ever passing through this API. The resulting secure_url is then sent
 *       back to POST/PUT /properties as part of imageUrls.
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Signature issued
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 timestamp: { type: number }
 *                 folder: { type: string }
 *                 signature: { type: string }
 *                 apiKey: { type: string }
 *                 cloudName: { type: string }
 *                 maxImageSizeMb: { type: number }
 *                 maxImagesPerProperty: { type: number }
 *       400: { description: Cloudinary not configured on the server }
 *       401: { description: Unauthorized }
 */
router.post("/signature", requireAuth, uploadController.getSignature);

export default router;
