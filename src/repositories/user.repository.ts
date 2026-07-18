import { prisma } from "../config/prisma";
import { Prisma } from "@prisma/client";

// Repository layer: the ONLY place that talks to Prisma for Users. Services
// depend on this interface, not on Prisma directly — makes it trivial to
// swap ORMs, add caching, or mock in unit tests.
export const userRepository = {
  async findByEmail(email: string) {
    const normalizedEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: {
        email: normalizedEmail,
      },
    });

    console.log("Email:", normalizedEmail);
    console.log("User found:", !!user);

    return user;
  },

  findById(id: string) {
    return prisma.user.findUnique({ where: { id } });
  },

  create(data: Prisma.UserCreateInput) {
    return prisma.user.create({ data });
  },
  toPublicUser(user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    role: string;
    createdAt: Date;
  }) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      createdAt: user.createdAt,
    };
  },
};
