import { Router } from "express";
import { authController } from "../controllers/auth.controller";
import { validate } from "../middlewares/validate.middleware";
import { requireAuth } from "../middlewares/auth.middleware";
import { authLimiter } from "../middlewares/rateLimiters";
import { registerSchema, loginSchema } from "../validators/auth.validator";

const router = Router();

router.post(
  "/register",
  authLimiter,
  validate(registerSchema),
  authController.register,
);
router.post("/login", authLimiter, validate(loginSchema), authController.login);
router.post("/refresh", authLimiter, authController.refresh);
router.post("/logout", authController.logout);
router.get("/profile", requireAuth, authController.profile);

export default router;
