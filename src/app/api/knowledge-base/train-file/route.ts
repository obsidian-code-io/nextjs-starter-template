import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth-utils";
import { requireOrganization } from "@/lib/organization";
import { prisma } from "@/lib/db";
import { getFile } from "@/lib/storage";
import { uploadFileToVectorStore } from "@/services/vector-store-service";

/**
 * POST /api/knowledge-base/train-file - Upload and train a file
 */
export async function POST(request: NextRequest) {
  try {
    const session = await verifySession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organizationId = await requireOrganization();
    const formData = await request.formData();
    const fileStorageId = formData.get("fileStorageId") as string;

    if (!fileStorageId) {
      return NextResponse.json(
        { error: "fileStorageId is required" },
        { status: 400 },
      );
    }

    // Get knowledge base
    const knowledgeBase = await prisma.knowledgeBase.findUnique({
      where: { organizationId },
    });

    if (!knowledgeBase) {
      return NextResponse.json(
        { error: "Knowledge base not found" },
        { status: 404 },
      );
    }

    if (!knowledgeBase.vectorStoreId) {
      return NextResponse.json(
        { error: "Vector store not initialized" },
        { status: 400 },
      );
    }

    // Get file from storage
    const fileData = await getFile(fileStorageId);
    const fileStorage = await prisma.fileStorage.findUnique({
      where: { id: fileStorageId },
    });

    if (!fileStorage) {
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 },
      );
    }

    // Check if file is already being trained
    const existingTraining = await prisma.trainingFile.findFirst({
      where: {
        knowledgeBaseId: knowledgeBase.id,
        fileStorageId: fileStorageId,
      },
    });

    if (existingTraining) {
      return NextResponse.json(
        { error: "File is already being trained" },
        { status: 400 },
      );
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
    uploadFileToVectorStore(
      knowledgeBase.vectorStoreId,
      fileData.file,
      fileStorage.fileName,
    )
      .then(async () => {
        await prisma.trainingFile.update({
          where: { id: trainingFile.id },
          data: {
            status: "COMPLETED",
            processedAt: new Date(),
          },
        });
      })
      .catch(async (error) => {
        console.error("Error uploading file to vector store:", error);
        await prisma.trainingFile.update({
          where: { id: trainingFile.id },
          data: {
            status: "FAILED",
            errorMessage: error.message || "Failed to upload file",
          },
        });
      });

    return NextResponse.json({ data: trainingFile }, { status: 201 });
  } catch (error: any) {
    console.error("Error training file:", error);
    return NextResponse.json(
      { error: error.message || "Failed to train file" },
      { status: 500 },
    );
  }
}

