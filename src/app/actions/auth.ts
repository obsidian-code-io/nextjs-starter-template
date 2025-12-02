"use server";

import { prisma } from "@/lib/db";
import {
  hashPassword,
  verifyPassword,
  createSession,
  deleteSession,
  verifySession,
} from "@/lib/auth-utils";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export async function signup(prevState: any, formData: FormData) {
  const result = signupSchema.safeParse(Object.fromEntries(formData));

  if (!result.success) {
    return { error: result.error.flatten().fieldErrors };
  }

  const { email, password, name } = result.data;

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return { error: { email: ["Email already in use"] } };
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
      },
    });

    await createSession(user.id);
  } catch (error) {
    return { error: { root: ["Failed to create user"] } };
  }

  redirect("/dashboard");
}

export async function login(prevState: any, formData: FormData) {
  const result = loginSchema.safeParse(Object.fromEntries(formData));

  if (!result.success) {
    return { error: result.error.flatten().fieldErrors };
  }

  const { email, password } = result.data;

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.passwordHash) {
      return { error: { root: ["Invalid credentials"] } };
    }

    const isValid = await verifyPassword(user.passwordHash, password);

    if (!isValid) {
      return { error: { root: ["Invalid credentials"] } };
    }

    await createSession(user.id);
  } catch (error) {
    return { error: { root: ["Failed to login"] } };
  }

  redirect("/dashboard");
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}

export async function forgotPassword(prevState: any, formData: FormData) {
  const email = formData.get("email") as string;

  if (!email) {
    return { error: "Email is required" };
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (user) {
    // Generate reset token (mock implementation)
    const resetToken = Math.random().toString(36).substring(2, 15);
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken, resetTokenExpiry },
    });

    console.log(`Reset token for ${email}: ${resetToken}`);
  }

  return { success: "If an account exists, a reset link has been sent." };
}

const updateProfileSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  profilePictureFile: z.instanceof(File).optional(),
});

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z
      .string()
      .min(8, "Password must be at least 8 characters"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export async function updateProfile(prevState: any, formData: FormData) {
  const session = await verifySession();

  if (!session || !session.userId) {
    return { error: "Unauthorized" };
  }

  try {
    const data = Object.fromEntries(formData);
    const result = updateProfileSchema.safeParse({
      name: data.name,
      profilePictureFile:
        data.profilePictureFile instanceof File
          ? data.profilePictureFile
          : undefined,
    });

    if (!result.success) {
      return { error: result.error.flatten().fieldErrors };
    }

    let profilePictureUrl: string | undefined = undefined;

    // Handle profile picture upload if provided
    if (
      result.data.profilePictureFile &&
      result.data.profilePictureFile.size > 0
    ) {
      const arrayBuffer = await result.data.profilePictureFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const { uploadFile } = await import("@/lib/storage");
      const uploadResult = await uploadFile({
        file: buffer,
        fileName: result.data.profilePictureFile.name,
        mimeType: result.data.profilePictureFile.type,
        userId: session.userId,
        isSecure: true, // Profile pictures are secure
        tokenExpiryHours: 24 * 365, // 1 year
      });

      profilePictureUrl = uploadResult.fileUrl;
    }

    // Update user
    const updateData: { name?: string; profilePictureUrl?: string } = {};

    if (result.data.name) {
      updateData.name = result.data.name;
    }

    if (profilePictureUrl) {
      updateData.profilePictureUrl = profilePictureUrl;
    }

    await prisma.user.update({
      where: { id: session.userId },
      data: updateData,
    });

    revalidatePath("/dashboard/profile");
    return { success: true };
  } catch (error: any) {
    console.error("Update profile error:", error);
    return { error: error.message || "Failed to update profile" };
  }
}

export async function changePassword(prevState: any, formData: FormData) {
  const session = await verifySession();

  if (!session || !session.userId) {
    return { error: "Unauthorized" };
  }

  try {
    const data = Object.fromEntries(formData);
    const result = changePasswordSchema.safeParse(data);

    if (!result.success) {
      return { error: result.error.flatten().fieldErrors };
    }

    // Get current user
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
    });

    if (!user || !user.passwordHash) {
      return { error: { root: ["User not found"] } };
    }

    // Verify current password
    const isValid = await verifyPassword(
      user.passwordHash,
      result.data.currentPassword,
    );

    if (!isValid) {
      return { error: { currentPassword: ["Current password is incorrect"] } };
    }

    // Hash new password
    const newPasswordHash = await hashPassword(result.data.newPassword);

    // Update password
    await prisma.user.update({
      where: { id: session.userId },
      data: { passwordHash: newPasswordHash },
    });

    revalidatePath("/dashboard/profile");
    return { success: true };
  } catch (error: any) {
    console.error("Change password error:", error);
    return { error: error.message || "Failed to change password" };
  }
}
