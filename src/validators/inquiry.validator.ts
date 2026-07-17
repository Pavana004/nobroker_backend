import { z } from "zod";

export const createInquirySchema = z.object({
  body: z.object({
    propertyId: z.string().uuid("Invalid property id"),
    message: z.string().trim().min(10, "Message must be at least 10 characters").max(1000),
  }),
});

export type CreateInquiryInput = z.infer<typeof createInquirySchema>["body"];
