import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth-utils";
import { requireOrganization } from "@/lib/organization";
import { prisma } from "@/lib/db";

/**
 * GET /api/agents/[id] - Get a specific agent
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await verifySession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organizationId = await requireOrganization();

    const agent = await prisma.agent.findFirst({
      where: {
        id: params.id,
        organizationId,
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

    if (!agent) {
      return NextResponse.json(
        { error: "Agent not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: agent });
  } catch (error: any) {
    console.error("Error fetching agent:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch agent" },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/agents/[id] - Update an agent
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await verifySession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organizationId = await requireOrganization();
    const body = await request.json();

    // Verify agent belongs to organization
    const existingAgent = await prisma.agent.findFirst({
      where: {
        id: params.id,
        organizationId,
      },
    });

    if (!existingAgent) {
      return NextResponse.json(
        { error: "Agent not found" },
        { status: 404 },
      );
    }

    // Validate knowledge base if provided
    if (body.knowledgeBaseId) {
      const knowledgeBase = await prisma.knowledgeBase.findFirst({
        where: {
          id: body.knowledgeBaseId,
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

    const agent = await prisma.agent.update({
      where: { id: params.id },
      data: {
        name: body.name,
        description: body.description,
        systemPrompt: body.systemPrompt,
        model: body.model,
        temperature: body.temperature,
        maxTokens: body.maxTokens,
        knowledgeBaseId: body.knowledgeBaseId,
        isActive: body.isActive,
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

    return NextResponse.json({ data: agent });
  } catch (error: any) {
    console.error("Error updating agent:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update agent" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/agents/[id] - Delete an agent
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await verifySession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organizationId = await requireOrganization();

    // Verify agent belongs to organization
    const agent = await prisma.agent.findFirst({
      where: {
        id: params.id,
        organizationId,
      },
    });

    if (!agent) {
      return NextResponse.json(
        { error: "Agent not found" },
        { status: 404 },
      );
    }

    await prisma.agent.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting agent:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete agent" },
      { status: 500 },
    );
  }
}

