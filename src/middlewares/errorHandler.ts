import { NextFunction, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { AppError } from "../utils/AppError";
import { failure } from "../utils/apiResponse";
import { isProd } from "../config/env";

// Placed LAST in the middleware chain. Express recognizes it as an error
// handler because it declares 4 parameters.
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
) {
  // --- Known, expected operational errors -----------------------------
  if (err instanceof AppError) {
    return res.status(err.statusCode).json(failure(err.message, err.errors));
  }

  // --- Zod validation errors that slipped through (defense in depth) --
  if (err instanceof ZodError) {
    return res.status(400).json(failure("Validation failed", err.flatten()));
  }

  // --- Prisma known errors: map to clean HTTP semantics ----------------
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      const target = (err.meta?.target as string[] | undefined)?.join(", ");
      return res.status(409).json(failure(`Duplicate value for: ${target ?? "unique field"}`));
    }
    if (err.code === "P2025") {
      return res.status(404).json(failure("Record not found"));
    }
    if (err.code === "P2003") {
      return res.status(400).json(failure("Invalid reference to a related record"));
    }
  }

  // --- Everything else: unexpected/programmer error --------------------
  // Log full detail server-side, never leak internals to the client.
  // eslint-disable-next-line no-console
  console.error("🔥 Unhandled error:", err);

  return res.status(500).json(
    failure(
      "Something went wrong on our end. Please try again.",
      isProd ? undefined : err instanceof Error ? err.stack : err
    )
  );
}

// 404 handler for unmatched routes — placed just before errorHandler.
export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json(failure(`Route not found: ${req.method} ${req.originalUrl}`));
}
