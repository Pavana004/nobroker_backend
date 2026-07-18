import { z } from "zod";
import { isCloudinaryUrl } from "../utils/cloudinary";

const PropertyTypeEnum = z.enum([
  "APARTMENT",
  "VILLA",
  "INDEPENDENT_HOUSE",
  "PLOT",
  "COMMERCIAL",
  "PG_HOSTEL",
]);
const FurnishingEnum = z.enum([
  "UNFURNISHED",
  "SEMI_FURNISHED",
  "FULLY_FURNISHED",
]);

export const createPropertySchema = z.object({
  body: z.object({
    title: z.string().trim().min(5).max(150),
    description: z.string().trim().min(20).max(5000),
    price: z.coerce.number().positive("Price must be greater than 0"),
    city: z.string().trim().min(2).max(100),
    locality: z.string().trim().min(2).max(150),
    address: z.string().trim().min(5).max(300),
    latitude: z.coerce.number().min(-90).max(90).optional(),
    longitude: z.coerce.number().min(-180).max(180).optional(),
    propertyType: PropertyTypeEnum,
    bedrooms: z.coerce.number().int().min(0).max(20),
    bathrooms: z.coerce.number().int().min(0).max(20),
    area: z.coerce.number().positive(),
    furnishing: FurnishingEnum,
    amenities: z.array(z.string().trim().min(1)).max(30).default([]),
    imageUrls: z
      .array(
        z
          .string()
          .url()
          .refine(isCloudinaryUrl, "Image URL must be a Cloudinary URL"),
      )
      .max(10)
      .optional()
      .default([]),
  }),
});

export const updatePropertySchema = z.object({
  params: z.object({ id: z.string().uuid("Invalid property id") }),
  body: createPropertySchema.shape.body.partial(),
});

export const propertyIdParamSchema = z.object({
  params: z.object({ id: z.string().uuid("Invalid property id") }),
});
export const searchPropertiesSchema = z.object({
  query: z.object({
    city: z.string().trim().optional(),
    locality: z.string().trim().optional(),
    minPrice: z.coerce.number().nonnegative().optional(),
    maxPrice: z.coerce.number().positive().optional(),
    propertyType: PropertyTypeEnum.optional(),
    bedrooms: z.coerce.number().int().min(0).optional(),
    sortBy: z.enum(["price", "createdAt"]).default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
    cursor: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(50).default(12),
  }),
});

export type CreatePropertyInput = z.infer<typeof createPropertySchema>["body"];
export type UpdatePropertyInput = z.infer<typeof updatePropertySchema>["body"];
export type SearchPropertiesQuery = z.infer<
  typeof searchPropertiesSchema
>["query"];
