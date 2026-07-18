import rateLimit from "express-rate-limit";
import { env } from "../config/env";
import { failure } from "../utils/apiResponse";

export const generalLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: failure("Too many requests. Please try again later."),
});

export const authLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.AUTH_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: failure("Too many authentication attempts. Please try again later."),
});

export const inquiryLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.INQUIRY_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: failure("Too many inquiries sent. Please try again later."),
});
