import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import { SearchPropertiesQuery } from "../validators/property.validator";
import { decodeCursor } from "../utils/cursorPagination";

const publicPropertyInclude = {
  images: { orderBy: { sortOrder: "asc" as const } },
  owner: { select: { id: true, name: true, email: true, phone: true } },
};

export const propertyRepository = {
  create(ownerId: string, data: Omit<Prisma.PropertyCreateInput, "owner">) {
    return prisma.property.create({
      data: { ...data, owner: { connect: { id: ownerId } } },
      include: publicPropertyInclude,
    });
  },

  findById(id: string) {
    return prisma.property.findUnique({
      where: { id },
      include: publicPropertyInclude,
    });
  },

  update(id: string, data: Prisma.PropertyUpdateInput) {
    return prisma.property.update({
      where: { id },
      data,
      include: publicPropertyInclude,
    });
  },

  delete(id: string) {
    return prisma.property.delete({ where: { id } });
  },

  replaceImages(propertyId: string, urls: string[]) {
    return prisma.$transaction([
      prisma.propertyImage.deleteMany({ where: { propertyId } }),
      prisma.propertyImage.createMany({
        data: urls.map((url, index) => ({
          propertyId,
          url,
          sortOrder: index,
          isPrimary: index === 0,
        })),
      }),
    ]);
  },

  async search(query: SearchPropertiesQuery) {
    const {
      city,
      locality,
      minPrice,
      maxPrice,
      propertyType,
      bedrooms,
      sortBy,
      sortOrder,
      cursor,
      limit,
    } = query;

    const where: Prisma.PropertyWhereInput = {
      status: "ACTIVE",
      ...(city && { city: { equals: city, mode: "insensitive" } }),
      ...(locality && { locality: { equals: locality, mode: "insensitive" } }),
      ...(propertyType && { propertyType }),
      ...(bedrooms !== undefined && { bedrooms: { gte: bedrooms } }),
      ...((minPrice !== undefined || maxPrice !== undefined) && {
        price: {
          ...(minPrice !== undefined && { gte: minPrice }),
          ...(maxPrice !== undefined && { lte: maxPrice }),
        },
      }),
    };

    if (cursor) {
      const { sortValue, id } = decodeCursor(cursor);
      const op = sortOrder === "desc" ? "lt" : "gt";
      const sortColumn =
        sortBy === "price"
          ? new Prisma.Decimal(sortValue)
          : new Date(sortValue);

      where.OR = [
        { [sortBy]: { [op]: sortColumn } },
        { [sortBy]: sortColumn, id: { [op]: id } },
      ] as Prisma.PropertyWhereInput["OR"];
    }

    const rows = await prisma.property.findMany({
      where,
      take: limit + 1,
      orderBy: [{ [sortBy]: sortOrder }, { id: sortOrder }],
      include: publicPropertyInclude,
    });

    const hasNextPage = rows.length > limit;
    const page = hasNextPage ? rows.slice(0, limit) : rows;

    return { page, hasNextPage };
  },

  async findSimilar(property: {
    id: string;
    city: string;
    propertyType: string;
    price: Prisma.Decimal;
    bedrooms: number;
  }) {
    const priceNum = Number(property.price);
    const minPrice = priceNum * 0.8;
    const maxPrice = priceNum * 1.2;

    return prisma.property.findMany({
      where: {
        id: { not: property.id },
        status: "ACTIVE",
        city: property.city,
        propertyType:
          property.propertyType as Prisma.EnumPropertyTypeFilter["equals"],
        bedrooms: { gte: property.bedrooms - 1, lte: property.bedrooms + 1 },
        price: { gte: minPrice, lte: maxPrice },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: publicPropertyInclude,
    });
  },

  findManyByOwner(ownerId: string) {
    return prisma.property.findMany({
      where: { ownerId },
      orderBy: { createdAt: "desc" },
      include: publicPropertyInclude,
    });
  },
};
