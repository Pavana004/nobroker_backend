import { NextFunction, Request, Response } from "express";
import { AnyZodObject, ZodError } from "zod";
import { failure } from "../utils/apiResponse";

export const validate =
  (schema: AnyZodObject) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      if (parsed.body) req.body = parsed.body;
      if (parsed.query) req.query = parsed.query;
      if (parsed.params) req.params = parsed.params;

      return next();
    } catch (err) {
      if (err instanceof ZodError) {
        return res
          .status(400)
          .json(failure("Validation failed", err.flatten().fieldErrors));
      }
      return next(err);
    }
  };
