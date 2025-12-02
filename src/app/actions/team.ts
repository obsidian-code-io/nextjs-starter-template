"use server";

import { prisma } from "@/lib/db";
import { requireOrganization } from "@/lib/organization";
import { revalidatePath } from "next/cache";
import { hash } from "argon2";
import { UserRole } from "@prisma/client";

export type TeamMember = {
  id: string; // OrganizationAccess ID
  user: {
    id: string;
    name: string | null;
    email: string;
    profilePictureUrl: string | null;
  };
  legacyRole: UserRole;
  createdAt: Date;
};

export async function getOrganizationMembers() {
  const organizationId = await requireOrganization();

  const members = await prisma.organizationAccess.findMany({
    where: {
      organizationId,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          profilePictureUrl: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return members;
}

export async function inviteMember(data: {
  email: string;
  name: string;
  role: UserRole;
}) {
  const organizationId = await requireOrganization();

  try {
    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    // If user doesn't exist, create them with a default password
    if (!user) {
      const hashedPassword = await hash("123456"); // Default password
      user = await prisma.user.create({
        data: {
          email: data.email,
          name: data.name,
          passwordHash: hashedPassword,
        },
      });
    }

    // Check if already a member
    const existingAccess = await prisma.organizationAccess.findUnique({
      where: {
        userId_organizationId: {
          userId: user.id,
          organizationId,
        },
      },
    });

    if (existingAccess) {
      return { success: false, error: "User is already a member of this organization" };
    }

    // Add to organization
    await prisma.organizationAccess.create({
      data: {
        userId: user.id,
        organizationId,
        legacyRole: data.role,
      },
    });

    revalidatePath("/dashboard/team");
    return { success: true };
  } catch (error) {
    console.error("Failed to invite member:", error);
    return { success: false, error: "Failed to invite member" };
  }
}

export async function removeMember(accessId: string) {
  const organizationId = await requireOrganization();

  try {
    // Verify the access belongs to the current organization
    const access = await prisma.organizationAccess.findUnique({
      where: { id: accessId },
    });

    if (!access || access.organizationId !== organizationId) {
      return { success: false, error: "Unauthorized or member not found" };
    }

    await prisma.organizationAccess.delete({
      where: { id: accessId },
    });

    revalidatePath("/dashboard/team");
    return { success: true };
  } catch (error) {
    console.error("Failed to remove member:", error);
    return { success: false, error: "Failed to remove member" };
  }
}

export async function updateMemberRole(accessId: string, role: UserRole) {
  const organizationId = await requireOrganization();

  try {
     // Verify the access belongs to the current organization
     const access = await prisma.organizationAccess.findUnique({
      where: { id: accessId },
    });

    if (!access || access.organizationId !== organizationId) {
      return { success: false, error: "Unauthorized or member not found" };
    }

    await prisma.organizationAccess.update({
      where: { id: accessId },
      data: {
        legacyRole: role,
      },
    });

    revalidatePath("/dashboard/team");
    return { success: true };
  } catch (error) {
    console.error("Failed to update member role:", error);
    return { success: false, error: "Failed to update member role" };
  }
}

