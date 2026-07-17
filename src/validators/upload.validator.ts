import { z } from "zod";

export const cloudinarySignatureSchema = z.object({
  body: z.object({
    folder: z.string().trim().min(1).max(100).optional(),
  }),
});
