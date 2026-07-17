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

  // -------------------------------------------------------------------
  // SEARCH with cursor (keyset) pagination.
  //
  // Why not OFFSET/LIMIT? OFFSET forces Postgres to scan and discard every
  // row before the offset — page 500 at offset=5000 means scanning 5000
  // rows just to throw them away, and that cost grows linearly with page
  // depth. It also produces skipped/duplicated rows if data changes between
  // page loads (a new listing pushes everything down by one).
  //
  // Keyset pagination instead says "give me rows strictly after the last
  // one I saw" using an indexed WHERE clause — O(log n) via the B-tree
  // index regardless of how deep you page, and stable under concurrent
  // writes. The cost: no "jump to page 42" — only next/previous, which is
  // exactly the UX real listing sites use anyway (infinite scroll / Next).
  // -------------------------------------------------------------------
  async search(query: SearchPropertiesQuery) {
    const { city, locality, minPrice, maxPrice, propertyType, bedrooms, sortBy, sortOrder, cursor, limit } =
      query;

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

    // Build the keyset predicate: "rows after the cursor" in the chosen
    // sort direction, using (sortColumn, id) as a composite tiebreaker.
    if (cursor) {
      const { sortValue, id } = decodeCursor(cursor);
      const op = sortOrder === "desc" ? "lt" : "gt";
      const sortColumn = sortBy === "price" ? new Prisma.Decimal(sortValue) : new Date(sortValue);

      where.OR = [
        { [sortBy]: { [op]: sortColumn } },
        { [sortBy]: sortColumn, id: { [op]: id } },
      ] as Prisma.PropertyWhereInput["OR"];
    }

    const rows = await prisma.property.findMany({
      where,
      // Fetch one extra row to know whether a next page exists, without a
      // separate COUNT(*) query (which is itself expensive at scale).
      take: limit + 1,
      orderBy: [{ [sortBy]: sortOrder }, { id: sortOrder }],
      include: publicPropertyInclude,
    });

    const hasNextPage = rows.length > limit;
    const page = hasNextPage ? rows.slice(0, limit) : rows;

    return { page, hasNextPage };
  },

  // -------------------------------------------------------------------
  // SIMILAR PROPERTIES
  //
  // Strategy: same city + same property type are hard filters (a 2BHK
  // apartment buyer in Bangalore doesn't want a villa in Pune). Budget and
  // bedroom count are soft — we widen a tolerance band (±20% price, ±1
  // bedroom) rather than exact-matching, since exact matches are rare and
  // an empty result set is a worse UX than an approximate one.
  //
  // The query rides the composite index @@index([city, bedrooms, price])
  // defined in schema.prisma, so this stays fast even at 10k+ rows.
  // -------------------------------------------------------------------
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
        propertyType: property.propertyType as Prisma.EnumPropertyTypeFilter["equals"],
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
