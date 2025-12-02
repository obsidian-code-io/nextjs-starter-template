"use server";

import { prisma } from "@/lib/db";
import { verifySession } from "@/lib/auth-utils";

export async function getCurrentUser() {
  const session = await verifySession();

  if (!session || !session.userId) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      email: true,
      name: true,
      profilePictureUrl: true,
      createdAt: true,
    },
  });

  return user;
}
