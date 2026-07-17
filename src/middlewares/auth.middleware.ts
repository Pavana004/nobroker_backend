import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/AppError";
import { verifyAccessToken } from "../utils/tokens";

// Augment Express's Request type so `req.user` is typed everywhere downstream.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: { id: string; role: string };
    }
  }
}

// Verifies the short-lived access token sent as `Authorization: Bearer <token>`.
// This never touches the database — that's the point of an access token:
// fast, stateless auth on every request. Revocation is handled at the
// refresh-token layer (see auth.service.ts), not here.
export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    return next(AppError.unauthorized("Missing or malformed Authorization header"));
  }

  const token = header.slice("Bearer ".length);

  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, role: payload.role };
    return next();
  } catch {
    return next(AppError.unauthorized("Invalid or expired access token"));
  }
}

// Prepares for future roles (Admin dashboard) without changing route
// signatures later — routes just add requireRole("ADMIN").
export function requireRole(...allowedRoles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(AppError.unauthorized());
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(AppError.forbidden("You do not have permission to perform this action"));
    }
    return next();
  };
}

// Optional auth: attaches req.user if a valid token is present, but does not
// reject the request otherwise. Useful for endpoints like GET /properties/:id
// where owners might see extra fields (e.g. inquiry count) that anonymous
// visitors shouldn't.
export function attachUserIfPresent(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) {
    try {
      const payload = verifyAccessToken(header.slice("Bearer ".length));
      req.user = { id: payload.sub, role: payload.role };
    } catch {
      // ignore invalid token in optional-auth context
    }
  }
  next();
}
