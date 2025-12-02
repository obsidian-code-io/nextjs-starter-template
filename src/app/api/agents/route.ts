import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth-utils";
import { requireOrganization } from "@/lib/organization";
import { prisma } from "@/lib/db";

/**
 * GET /api/agents - Get all agents for current organization
 */
export async function GET() {
  try {
    const session = await verifySession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organizationId = await requireOrganization();

    const agents = await prisma.agent.findMany({
      where: { organizationId },
      include: {
        knowledgeBase: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ data: agents });
  } catch (error: any) {
    console.error("Error fetching agents:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch agents" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/agents - Create a new agent
 */
export async function POST(request: NextRequest) {
  try {
    const session = await verifySession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organizationId = await requireOrganization();
    const body = await request.json();
    const {
      name,
      description,
      systemPrompt,
      model,
      temperature,
      maxTokens,
      knowledgeBaseId,
    } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 },
      );
    }

    // Validate knowledge base belongs to organization if provided
    if (knowledgeBaseId) {
      const knowledgeBase = await prisma.knowledgeBase.findFirst({
        where: {
          id: knowledgeBaseId,
          organizationId,
        },
      });

      if (!knowledgeBase) {
        return NextResponse.json(
          { error: "Knowledge base not found or access denied" },
          { status: 404 },
        );
      }
    }

    const agent = await prisma.agent.create({
      data: {
        organizationId,
        name,
        description: description || null,
        systemPrompt: systemPrompt || null,
        model: model || "gpt-4",
        temperature: temperature !== undefined ? temperature : 0.7,
        maxTokens: maxTokens || null,
        knowledgeBaseId: knowledgeBaseId || null,
      },
      include: {
        knowledgeBase: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
    });

    return NextResponse.json({ data: agent }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating agent:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create agent" },
      { status: 500 },
    );
  }
}

