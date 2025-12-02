import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth-utils";
import { requireOrganization } from "@/lib/organization";
import { prisma } from "@/lib/db";
import {
  createVectorStore,
  getVectorStore,
  updateVectorStore,
} from "@/services/vector-store-service";

/**
 * GET /api/knowledge-base - Get knowledge base for current organization
 */
export async function GET() {
  try {
    const session = await verifySession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    if (!knowledgeBase) {
      return NextResponse.json(
        { error: "Knowledge base not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: knowledgeBase });
  } catch (error: any) {
    console.error("Error fetching knowledge base:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch knowledge base" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/knowledge-base - Create or initialize knowledge base
 */
export async function POST(request: NextRequest) {
  try {
    const session = await verifySession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organizationId = await requireOrganization();
    const body = await request.json();
    const { name, description } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 },
      );
    }

    // Check if knowledge base already exists
    const existing = await prisma.knowledgeBase.findUnique({
      where: { organizationId },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Knowledge base already exists for this organization" },
        { status: 400 },
      );
    }

    // Create vector store in OpenAI
    let vectorStoreId: string | null = null;
    let status: "PENDING" | "CREATING" | "READY" | "ERROR" = "CREATING";

    try {
      const vectorStore = await createVectorStore({
        name: `${name} - Knowledge Base`,
        description: description || undefined,
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
        name,
        description: description || null,
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

    return NextResponse.json({ data: knowledgeBase }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating knowledge base:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create knowledge base" },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/knowledge-base - Update knowledge base
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await verifySession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organizationId = await requireOrganization();
    const body = await request.json();
    const { name, description } = body;

    const knowledgeBase = await prisma.knowledgeBase.findUnique({
      where: { organizationId },
    });

    if (!knowledgeBase) {
      return NextResponse.json(
        { error: "Knowledge base not found" },
        { status: 404 },
      );
    }

    // Update vector store in OpenAI if it exists
    if (knowledgeBase.vectorStoreId) {
      try {
        await updateVectorStore(knowledgeBase.vectorStoreId, {
          name: name || knowledgeBase.name,
          description: description || knowledgeBase.description || undefined,
        });
      } catch (error: any) {
        console.error("Error updating vector store:", error);
      }
    }

    // Update knowledge base in database
    const updated = await prisma.knowledgeBase.update({
      where: { id: knowledgeBase.id },
      data: {
        name: name || knowledgeBase.name,
        description: description !== undefined ? description : knowledgeBase.description,
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

    return NextResponse.json({ data: updated });
  } catch (error: any) {
    console.error("Error updating knowledge base:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update knowledge base" },
      { status: 500 },
    );
  }
}

