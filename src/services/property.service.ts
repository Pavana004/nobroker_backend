import { propertyRepository } from "../repositories/property.repository";
import { AppError } from "../utils/AppError";
import { encodeCursor } from "../utils/cursorPagination";
import {
  CreatePropertyInput,
  SearchPropertiesQuery,
  UpdatePropertyInput,
} from "../validators/property.validator";

export const propertyService = {
  async create(ownerId: string, input: CreatePropertyInput) {
    const { imageUrls, ...propertyData } = input;

    const property = await propertyRepository.create(ownerId, propertyData);

    if (imageUrls && imageUrls.length > 0) {
      await propertyRepository.replaceImages(property.id, imageUrls);
      return propertyRepository.findById(property.id);
    }

    return property;
  },

  async getById(id: string) {
    const property = await propertyRepository.findById(id);
    if (!property) throw AppError.notFound("Property not found");
    return property;
  },

  async update(id: string, ownerId: string, input: UpdatePropertyInput) {
    const existing = await propertyRepository.findById(id);
    if (!existing) throw AppError.notFound("Property not found");
    if (existing.ownerId !== ownerId) {
      throw AppError.forbidden("You can only update your own properties");
    }

    const { imageUrls, ...propertyData } = input;
    const updated = await propertyRepository.update(id, propertyData);

    if (imageUrls) {
      await propertyRepository.replaceImages(id, imageUrls);
      return propertyRepository.findById(id);
    }

    return updated;
  },

  async remove(id: string, ownerId: string) {
    const existing = await propertyRepository.findById(id);
    if (!existing) throw AppError.notFound("Property not found");

    if (existing.ownerId !== ownerId) {
      throw AppError.forbidden("You can only delete your own properties");
    }

    await propertyRepository.delete(id);
  },

  async search(query: SearchPropertiesQuery) {
    const { page, hasNextPage } = await propertyRepository.search(query);

    const last = page[page.length - 1];
    const nextCursor =
      hasNextPage && last
        ? encodeCursor(
            query.sortBy === "price"
              ? last.price.toString()
              : last.createdAt.toISOString(),
            last.id,
          )
        : null;

    return {
      properties: page,
      pagination: { nextCursor, hasNextPage, count: page.length },
    };
  },

  async getSimilar(propertyId: string) {
    const property = await propertyRepository.findById(propertyId);
    if (!property) throw AppError.notFound("Property not found");
    return propertyRepository.findSimilar(property);
  },

  getMyProperties(ownerId: string) {
    return propertyRepository.findManyByOwner(ownerId);
  },
};
