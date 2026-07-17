import rateLimit from "express-rate-limit";
import { env } from "../config/env";
import { failure } from "../utils/apiResponse";

// General API-wide limiter — generous, mostly a backstop against abuse/bots.
export const generalLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: failure("Too many requests. Please try again later."),
});

// Tighter limiter on auth endpoints (login/register/refresh) — the classic
// brute-force / credential-stuffing surface.
export const authLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.AUTH_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: failure("Too many authentication attempts. Please try again later."),
});

// Inquiry creation is a common spam vector (bots messaging every owner in a
// city). Combined with the DB-level unique(propertyId, senderId) constraint
// and a cooldown check in the service layer, this is defense in depth.
export const inquiryLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.INQUIRY_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: failure("Too many inquiries sent. Please try again later."),
});
