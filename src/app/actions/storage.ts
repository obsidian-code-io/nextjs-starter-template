"use server";

import { uploadFile, deleteFile } from "@/lib/storage";
import { verifySession } from "@/lib/auth-utils";
import { revalidatePath } from "next/cache";

export interface UploadFileParams {
  file: File;
  organizationId?: string;
  isSecure?: boolean;
  tokenExpiryHours?: number;
}

/**
 * Upload a file and return the file URL
 */
export async function uploadFileAction(params: UploadFileParams) {
  const session = await verifySession();

  if (!session || !session.userId) {
    throw new Error("Unauthorized");
  }

  try {
    // Convert File to Buffer
    const arrayBuffer = await params.file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await uploadFile({
      file: buffer,
      fileName: params.file.name,
      mimeType: params.file.type,
      organizationId: params.organizationId,
      userId: session.userId,
      isSecure: params.isSecure,
      tokenExpiryHours: params.tokenExpiryHours,
    });

    return { success: true, data: result };
  } catch (error: any) {
    console.error("File upload error:", error);
    return { success: false, error: error.message || "Failed to upload file" };
  }
}

/**
 * Delete a file
 */
export async function deleteFileAction(fileStorageId: string) {
  const session = await verifySession();

  if (!session || !session.userId) {
    throw new Error("Unauthorized");
  }

  try {
    await deleteFile(fileStorageId);
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("File delete error:", error);
    return { success: false, error: error.message || "Failed to delete file" };
  }
}
