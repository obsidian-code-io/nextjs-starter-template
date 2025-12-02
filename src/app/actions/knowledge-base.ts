"use server";

import { verifySession } from "@/lib/auth-utils";
import { requireOrganization } from "@/lib/organization";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import {
  createVectorStore,
  updateVectorStore,
  uploadFileToVectorStore,
  uploadUrlToVectorStore,
  deleteVectorStore,
  listVectorStoreFiles,
  removeFileFromVectorStore,
} from "@/services/vector-store-service";
import { getFile } from "@/lib/storage";

export interface CreateKnowledgeBaseParams {
  name: string;
  description?: string;
}

export interface UpdateKnowledgeBaseParams {
  name?: string;
  description?: string;
}

/**
 * Get knowledge base for current organization
 */
export async function getKnowledgeBase() {
  const session = await verifySession();

  if (!session || !session.userId) {
    throw new Error("Unauthorized");
  }

  try {
    const organizationId = await requireOrganization();

    const knowledgeBase = await prisma.knowledgeBase.findUnique({
      where: { organizationId },
      include: {
        trainingFiles: {
          include: {
            fileStorage: true,
          },
          orderBy: { createdAt: "desc" },
        },
        trainingWebsites: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    return { success: true, data: knowledgeBase };
  } catch (error: any) {
    console.error("Error fetching knowledge base:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch knowledge base",
    };
  }
}

/**
 * Create or initialize knowledge base
 */
export async function createKnowledgeBase(params: CreateKnowledgeBaseParams) {
  const session = await verifySession();

  if (!session || !session.userId) {
    throw new Error("Unauthorized");
  }

  try {
    const organizationId = await requireOrganization();

    // Check if knowledge base already exists
    const existing = await prisma.knowledgeBase.findUnique({
      where: { organizationId },
    });

    if (existing) {
      return {
        success: false,
        error: "Knowledge base already exists for this organization",
      };
    }

    // Create vector store in OpenAI
    let vectorStoreId: string | null = null;
    let status: "PENDING" | "CREATING" | "READY" | "ERROR" = "CREATING";

    try {
      const vectorStore = await createVectorStore({
        name: `${params.name} - Knowledge Base`,
        description: params.description || undefined,
      });
      vectorStoreId = vectorStore.id;
      status = "READY";
    } catch (error: any) {
      console.error("Error creating vector store:", error);
      status = "ERROR";
    }

    // Create knowledge base in database
    const knowledgeBase = await prisma.knowledgeBase.create({
      data: {
        organizationId,
        name: params.name,
        description: params.description || null,
        vectorStoreId,
        status,
      },
      include: {
        trainingFiles: {
          include: {
            fileStorage: true,
          },
        },
        trainingWebsites: true,
      },
    });

    revalidatePath("/dashboard/knowledge-base");
    return { success: true, data: knowledgeBase };
  } catch (error: any) {
    console.error("Error creating knowledge base:", error);
    return {
      success: false,
      error: error.message || "Failed to create knowledge base",
    };
  }
}

/**
 * Update knowledge base
 */
export async function updateKnowledgeBase(params: UpdateKnowledgeBaseParams) {
  const session = await verifySession();

  if (!session || !session.userId) {
    throw new Error("Unauthorized");
  }

  try {
    const organizationId = await requireOrganization();

    const knowledgeBase = await prisma.knowledgeBase.findUnique({
      where: { organizationId },
    });

    if (!knowledgeBase) {
      throw new Error("Knowledge base not found");
    }

    // Update vector store in OpenAI if it exists
    if (knowledgeBase.vectorStoreId) {
      try {
        await updateVectorStore(knowledgeBase.vectorStoreId, {
          name: params.name || knowledgeBase.name,
          description:
            params.description !== undefined
              ? params.description
              : knowledgeBase.description || undefined,
        });
      } catch (error: any) {
        console.error("Error updating vector store:", error);
      }
    }

    // Update knowledge base in database
    const updated = await prisma.knowledgeBase.update({
      where: { id: knowledgeBase.id },
      data: {
        name: params.name || knowledgeBase.name,
        description:
          params.description !== undefined
            ? params.description
            : knowledgeBase.description,
      },
      include: {
        trainingFiles: {
          include: {
            fileStorage: true,
          },
        },
        trainingWebsites: true,
      },
    });

    revalidatePath("/dashboard/knowledge-base");
    return { success: true, data: updated };
  } catch (error: any) {
    console.error("Error updating knowledge base:", error);
    return {
      success: false,
      error: error.message || "Failed to update knowledge base",
    };
  }
}

/**
 * Train a file in the knowledge base
 */
export async function trainFile(fileStorageId: string) {
  const session = await verifySession();

  if (!session || !session.userId) {
    throw new Error("Unauthorized");
  }

  try {
    const organizationId = await requireOrganization();

    // Get knowledge base
    const knowledgeBase = await prisma.knowledgeBase.findUnique({
      where: { organizationId },
    });

    if (!knowledgeBase) {
      throw new Error("Knowledge base not found");
    }

    if (!knowledgeBase.vectorStoreId) {
      throw new Error("Vector store not initialized");
    }

    // Check if file is already being trained
    const existingTraining = await prisma.trainingFile.findFirst({
      where: {
        knowledgeBaseId: knowledgeBase.id,
        fileStorageId: fileStorageId,
      },
    });

    if (existingTraining) {
      return {
        success: false,
        error: "File is already being trained",
      };
    }

    // Create training file record
    const trainingFile = await prisma.trainingFile.create({
      data: {
        knowledgeBaseId: knowledgeBase.id,
        fileStorageId: fileStorageId,
        status: "PROCESSING",
      },
      include: {
        fileStorage: true,
      },
    });

    // Upload to vector store asynchronously
    (async () => {
      try {
        const fileData = await getFile(fileStorageId);
        await uploadFileToVectorStore(
          knowledgeBase.vectorStoreId!,
          fileData.file,
          fileData.fileName,
        );

        await prisma.trainingFile.update({
          where: { id: trainingFile.id },
          data: {
            status: "COMPLETED",
            processedAt: new Date(),
          },
        });
      } catch (error: any) {
        console.error("Error uploading file to vector store:", error);
        await prisma.trainingFile.update({
          where: { id: trainingFile.id },
          data: {
            status: "FAILED",
            errorMessage: error.message || "Failed to upload file",
          },
        });
      }
      revalidatePath("/dashboard/knowledge-base");
    })();

    revalidatePath("/dashboard/knowledge-base");
    return { success: true, data: trainingFile };
  } catch (error: any) {
    console.error("Error training file:", error);
    return {
      success: false,
      error: error.message || "Failed to train file",
    };
  }
}

/**
 * Train a website URL in the knowledge base
 */
export async function trainWebsite(url: string) {
  const session = await verifySession();

  if (!session || !session.userId) {
    throw new Error("Unauthorized");
  }

  try {
    const organizationId = await requireOrganization();

    // Validate URL
    try {
      new URL(url);
    } catch {
      return { success: false, error: "Invalid URL" };
    }

    // Get knowledge base
    const knowledgeBase = await prisma.knowledgeBase.findUnique({
      where: { organizationId },
    });

    if (!knowledgeBase) {
      throw new Error("Knowledge base not found");
    }

    if (!knowledgeBase.vectorStoreId) {
      throw new Error("Vector store not initialized");
    }

    // Check if URL is already being trained
    const existingTraining = await prisma.trainingWebsite.findFirst({
      where: {
        knowledgeBaseId: knowledgeBase.id,
        url: url,
      },
    });

    if (existingTraining) {
      return {
        success: false,
        error: "URL is already being trained",
      };
    }

    // Create training website record
    const trainingWebsite = await prisma.trainingWebsite.create({
      data: {
        knowledgeBaseId: knowledgeBase.id,
        url: url,
        status: "PROCESSING",
      },
    });

    // Upload to vector store asynchronously
    (async () => {
      try {
        await uploadUrlToVectorStore(knowledgeBase.vectorStoreId!, url);

        await prisma.trainingWebsite.update({
          where: { id: trainingWebsite.id },
          data: {
            status: "COMPLETED",
            processedAt: new Date(),
          },
        });
      } catch (error: any) {
        console.error("Error uploading website to vector store:", error);
        await prisma.trainingWebsite.update({
          where: { id: trainingWebsite.id },
          data: {
            status: "FAILED",
            errorMessage: error.message || "Failed to upload website",
          },
        });
      }
      revalidatePath("/dashboard/knowledge-base");
    })();

    revalidatePath("/dashboard/knowledge-base");
    return { success: true, data: trainingWebsite };
  } catch (error: any) {
    console.error("Error training website:", error);
    return {
      success: false,
      error: error.message || "Failed to train website",
    };
  }
}

/**
 * Reset knowledge base - delete all training data and optionally recreate vector store
 */
export async function resetKnowledgeBase() {
  const session = await verifySession();

  if (!session || !session.userId) {
    throw new Error("Unauthorized");
  }

  try {
    const organizationId = await requireOrganization();

    const knowledgeBase = await prisma.knowledgeBase.findUnique({
      where: { organizationId },
      include: {
        trainingFiles: true,
        trainingWebsites: true,
      },
    });

    if (!knowledgeBase) {
      throw new Error("Knowledge base not found");
    }

    // Delete all files from vector store if it exists
    if (knowledgeBase.vectorStoreId) {
      try {
        const files = await listVectorStoreFiles(knowledgeBase.vectorStoreId);
        for (const file of files) {
          try {
            await removeFileFromVectorStore(
              knowledgeBase.vectorStoreId!,
              file.id,
            );
          } catch (error) {
            console.error(`Error removing file ${file.id}:`, error);
          }
        }
      } catch (error: any) {
        console.error("Error clearing vector store files:", error);
      }
    }

    // Delete all training files and websites from database
    await prisma.trainingFile.deleteMany({
      where: { knowledgeBaseId: knowledgeBase.id },
    });

    await prisma.trainingWebsite.deleteMany({
      where: { knowledgeBaseId: knowledgeBase.id },
    });

    // Update knowledge base status
    await prisma.knowledgeBase.update({
      where: { id: knowledgeBase.id },
      data: {
        status: "READY",
      },
    });

    revalidatePath("/dashboard/knowledge-base");
    return { success: true };
  } catch (error: any) {
    console.error("Error resetting knowledge base:", error);
    return {
      success: false,
      error: error.message || "Failed to reset knowledge base",
    };
  }
}

