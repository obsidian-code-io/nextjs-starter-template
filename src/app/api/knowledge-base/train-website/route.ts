import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth-utils";
import { requireOrganization } from "@/lib/organization";
import { prisma } from "@/lib/db";
import { uploadUrlToVectorStore } from "@/services/vector-store-service";

/**
 * POST /api/knowledge-base/train-website - Train a website URL
 */
export async function POST(request: NextRequest) {
  try {
    const session = await verifySession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organizationId = await requireOrganization();
    const body = await request.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json(
        { error: "URL is required" },
        { status: 400 },
      );
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
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

    // Check if URL is already being trained
    const existingTraining = await prisma.trainingWebsite.findFirst({
      where: {
        knowledgeBaseId: knowledgeBase.id,
        url: url,
      },
    });

    if (existingTraining) {
      return NextResponse.json(
        { error: "URL is already being trained" },
        { status: 400 },
      );
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
    uploadUrlToVectorStore(knowledgeBase.vectorStoreId, url)
      .then(async () => {
        await prisma.trainingWebsite.update({
          where: { id: trainingWebsite.id },
          data: {
            status: "COMPLETED",
            processedAt: new Date(),
          },
        });
      })
      .catch(async (error) => {
        console.error("Error uploading website to vector store:", error);
        await prisma.trainingWebsite.update({
          where: { id: trainingWebsite.id },
          data: {
            status: "FAILED",
            errorMessage: error.message || "Failed to upload website",
          },
        });
      });

    return NextResponse.json({ data: trainingWebsite }, { status: 201 });
  } catch (error: any) {
    console.error("Error training website:", error);
    return NextResponse.json(
      { error: error.message || "Failed to train website" },
      { status: 500 },
    );
  }
}

