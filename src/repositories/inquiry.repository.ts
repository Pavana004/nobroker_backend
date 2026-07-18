import { prisma } from "../config/prisma";

export const inquiryRepository = {
  findExisting(propertyId: string, senderId: string) {
    return prisma.inquiry.findUnique({
      where: { unique_property_sender: { propertyId, senderId } },
    });
  },

  create(propertyId: string, senderId: string, message: string) {
    return prisma.inquiry.create({
      data: { propertyId, senderId, message },
      include: {
        property: {
          select: { id: true, title: true, city: true, ownerId: true },
        },
      },
    });
  },

  findByUser(senderId: string) {
    return prisma.inquiry.findMany({
      where: { senderId },
      orderBy: { createdAt: "desc" },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            city: true,
            price: true,
            images: { take: 1 },
          },
        },
      },
    });
  },

  countRecentByUser(senderId: string, sinceMinutesAgo: number) {
    const since = new Date(Date.now() - sinceMinutesAgo * 60 * 1000);
    return prisma.inquiry.count({
      where: { senderId, createdAt: { gte: since } },
    });
  },
};
