import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifySession } from "@/lib/auth-utils";

export async function GET() {
  const session = await verifySession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const accessList = await prisma.organizationAccess.findMany({
      where: { userId: session.userId },
      include: { organization: true },
    });

    const organizations = accessList.map((access) => ({
      id: access.organization.id,
      name: access.organization.name,
      code: access.organization.code,
      plan: "Enterprise",
    }));

    return NextResponse.json({ organizations });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch organizations" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const session = await verifySession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { name } = (await request.json()) as { name: string };

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const code = name
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 10);

    const organization = await prisma.organization.create({
      data: {
        name,
        code:
          code ||
          "ORG-" + Math.random().toString(36).substring(7).toUpperCase(),
      },
    });

    await prisma.organizationAccess.create({
      data: {
        userId: session.userId,
        organizationId: organization.id,
      },
    });

    // Auto-create knowledge base for the organization
    try {
      const { createVectorStore } = await import("@/services/vector-store-service");
      
      let vectorStoreId: string | null = null;
      let status: "PENDING" | "CREATING" | "READY" | "ERROR" = "CREATING";

      try {
        const vectorStore = await createVectorStore({
          name: `${name} - Knowledge Base`,
          description: `Knowledge base for ${name}`,
        });
        vectorStoreId = vectorStore.id;
        status = "READY";
      } catch (error: any) {
        console.error("Error creating vector store:", error);
        status = "ERROR";
      }

      await prisma.knowledgeBase.create({
        data: {
          organizationId: organization.id,
          name: `${name} Knowledge Base`,
          description: `Knowledge base for ${name}`,
          vectorStoreId,
          status,
        },
      });
    } catch (error: any) {
      console.error("Error creating knowledge base:", error);
      // Don't fail organization creation if knowledge base creation fails
    }

    return NextResponse.json({
      organization: {
        id: organization.id,
        name: organization.name,
        code: organization.code,
        plan: "Enterprise",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create organization", message: error },
      { status: 500 },
    );
  }
}
