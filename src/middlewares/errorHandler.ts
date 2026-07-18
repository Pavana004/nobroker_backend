import { NextFunction, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { AppError } from "../utils/AppError";
import { failure } from "../utils/apiResponse";
import { isProd } from "../config/env";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json(failure(err.message, err.errors));
  }

  if (err instanceof ZodError) {
    return res.status(400).json(failure("Validation failed", err.flatten()));
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      const target = (err.meta?.target as string[] | undefined)?.join(", ");
      return res
        .status(409)
        .json(failure(`Duplicate value for: ${target ?? "unique field"}`));
    }
    if (err.code === "P2025") {
      return res.status(404).json(failure("Record not found"));
    }
    if (err.code === "P2003") {
      return res
        .status(400)
        .json(failure("Invalid reference to a related record"));
    }
  }

  console.error("🔥 Unhandled error:", err);

  return res
    .status(500)
    .json(
      failure(
        "Something went wrong on our end. Please try again.",
        isProd ? undefined : err instanceof Error ? err.stack : err,
      ),
    );
}

export function notFoundHandler(req: Request, res: Response) {
  res
    .status(404)
    .json(failure(`Route not found: ${req.method} ${req.originalUrl}`));
}
