import { prisma } from "../config/prisma";

export const refreshTokenRepository = {
  create(data: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    userAgent?: string;
    ipAddress?: string;
  }) {
    return prisma.refreshToken.create({ data });
  },

  findByHash(tokenHash: string) {
    return prisma.refreshToken.findUnique({ where: { tokenHash } });
  },

  // Token rotation: mark the old token as revoked and record which token
  // replaced it. If a revoked token is ever presented again, that's a
  // strong signal of theft/replay — the caller can respond by revoking
  // the entire token family (see auth.service.ts).
  revoke(id: string, replacedById?: string) {
    return prisma.refreshToken.update({
      where: { id },
      data: { isRevoked: true, replacedBy: replacedById },
    });
  },

  revokeAllForUser(userId: string) {
    return prisma.refreshToken.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true },
    });
  },

  deleteExpired() {
    return prisma.refreshToken.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
  },
};
