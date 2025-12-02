"use server";

import { prisma } from "@/lib/db";
import { verifySession } from "@/lib/auth-utils";
import { uploadFile } from "@/lib/storage";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export async function getUserOrganizations() {
  const session = await verifySession();

  if (!session || !session.userId) {
    throw new Error("Unauthorized");
  }

  const organizations = await prisma.organizationAccess.findMany({
    where: {
      userId: session.userId,
    },
    include: {
      organization: true,
    },
  });

  return organizations.map((access) => access.organization);
}

export async function getCurrentOrganization() {
  const session = await verifySession();

  if (!session || !session.userId) {
    throw new Error("Unauthorized");
  }

  // Get user's current organization (you may need to adjust this based on your org selection logic)
  const access = await prisma.organizationAccess.findFirst({
    where: {
      userId: session.userId,
    },
    include: {
      organization: true,
    },
  });

  return access?.organization || null;
}

const updateOrganizationSchema = z.object({
  name: z.string().min(1, "Organization name is required"),
  logoFile: z.instanceof(File).optional(),
});

export async function updateOrganization(
  organizationId: string,
  prevState: any,
  formData: FormData,
) {
  const session = await verifySession();

  if (!session || !session.userId) {
    return { error: "Unauthorized" };
  }

  // Check if user has access to this organization
  const access = await prisma.organizationAccess.findUnique({
    where: {
      userId_organizationId: {
        userId: session.userId,
        organizationId: organizationId,
      },
    },
  });

  if (!access) {
    return { error: "You don't have access to this organization" };
  }

  try {
    const data = Object.fromEntries(formData);
    const result = updateOrganizationSchema.safeParse({
      name: data.name,
      logoFile: data.logoFile instanceof File ? data.logoFile : undefined,
    });

    if (!result.success) {
      return { error: result.error.flatten().fieldErrors };
    }

    let logoUrl: string | undefined = undefined;

    // Handle logo upload if provided
    if (result.data.logoFile && result.data.logoFile.size > 0) {
      const arrayBuffer = await result.data.logoFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const uploadResult = await uploadFile({
        file: buffer,
        fileName: result.data.logoFile.name,
        mimeType: result.data.logoFile.type,
        organizationId: organizationId,
        isSecure: false, // Organization logos are typically public
      });

      logoUrl = uploadResult.fileUrl;
    }

    // Update organization
    const updateData: { name: string; logoUrl?: string } = {
      name: result.data.name,
    };

    if (logoUrl) {
      updateData.logoUrl = logoUrl;
    }

    await prisma.organization.update({
      where: { id: organizationId },
      data: updateData,
    });

    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (error: any) {
    console.error("Update organization error:", error);
    return { error: error.message || "Failed to update organization" };
  }
}
