"use server";

import { verifySession } from "@/lib/auth-utils";
import { requireOrganization } from "@/lib/organization";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export interface CreateAgentParams {
  name: string;
  description?: string;
  systemPrompt?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  knowledgeBaseId?: string;
}

export interface UpdateAgentParams {
  id: string;
  name?: string;
  description?: string;
  systemPrompt?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  knowledgeBaseId?: string | null;
  isActive?: boolean;
}

/**
 * Create a new agent
 */
export async function createAgent(params: CreateAgentParams) {
  const session = await verifySession();

  if (!session || !session.userId) {
    throw new Error("Unauthorized");
  }

  try {
    const organizationId = await requireOrganization();

    // Validate knowledge base if provided
    if (params.knowledgeBaseId) {
      const knowledgeBase = await prisma.knowledgeBase.findFirst({
        where: {
          id: params.knowledgeBaseId,
          organizationId,
        },
      });

      if (!knowledgeBase) {
        throw new Error("Knowledge base not found or access denied");
      }
    }

    const agent = await prisma.agent.create({
      data: {
        organizationId,
        name: params.name,
        description: params.description || null,
        systemPrompt: params.systemPrompt || null,
        model: params.model || "gpt-4",
        temperature: params.temperature !== undefined ? params.temperature : 0.7,
        maxTokens: params.maxTokens || null,
        knowledgeBaseId: params.knowledgeBaseId || null,
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

    revalidatePath("/dashboard/agents");
    return { success: true, data: agent };
  } catch (error: any) {
    console.error("Error creating agent:", error);
    return { success: false, error: error.message || "Failed to create agent" };
  }
}

/**
 * Update an agent
 */
export async function updateAgent(params: UpdateAgentParams) {
  const session = await verifySession();

  if (!session || !session.userId) {
    throw new Error("Unauthorized");
  }

  try {
    const organizationId = await requireOrganization();

    // Verify agent belongs to organization
    const existingAgent = await prisma.agent.findFirst({
      where: {
        id: params.id,
        organizationId,
      },
    });

    if (!existingAgent) {
      throw new Error("Agent not found");
    }

    // Validate knowledge base if provided
    if (params.knowledgeBaseId !== undefined && params.knowledgeBaseId !== null) {
      const knowledgeBase = await prisma.knowledgeBase.findFirst({
        where: {
          id: params.knowledgeBaseId,
          organizationId,
        },
      });

      if (!knowledgeBase) {
        throw new Error("Knowledge base not found or access denied");
      }
    }

    const agent = await prisma.agent.update({
      where: { id: params.id },
      data: {
        name: params.name,
        description: params.description,
        systemPrompt: params.systemPrompt,
        model: params.model,
        temperature: params.temperature,
        maxTokens: params.maxTokens,
        knowledgeBaseId: params.knowledgeBaseId,
        isActive: params.isActive,
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

    revalidatePath("/dashboard/agents");
    revalidatePath(`/dashboard/agents/${params.id}`);
    return { success: true, data: agent };
  } catch (error: any) {
    console.error("Error updating agent:", error);
    return { success: false, error: error.message || "Failed to update agent" };
  }
}

/**
 * Delete an agent
 */
export async function deleteAgent(agentId: string) {
  const session = await verifySession();

  if (!session || !session.userId) {
    throw new Error("Unauthorized");
  }

  try {
    const organizationId = await requireOrganization();

    // Verify agent belongs to organization
    const agent = await prisma.agent.findFirst({
      where: {
        id: agentId,
        organizationId,
      },
    });

    if (!agent) {
      throw new Error("Agent not found");
    }

    await prisma.agent.delete({
      where: { id: agentId },
    });

    revalidatePath("/dashboard/agents");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting agent:", error);
    return { success: false, error: error.message || "Failed to delete agent" };
  }
}

/**
 * Get all agents for current organization
 */
export async function getAgents() {
  const session = await verifySession();

  if (!session || !session.userId) {
    throw new Error("Unauthorized");
  }

  try {
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

    return { success: true, data: agents };
  } catch (error: any) {
    console.error("Error fetching agents:", error);
    return { success: false, error: error.message || "Failed to fetch agents" };
  }
}

/**
 * Get a single agent
 */
export async function getAgent(agentId: string) {
  const session = await verifySession();

  if (!session || !session.userId) {
    throw new Error("Unauthorized");
  }

  try {
    const organizationId = await requireOrganization();

    const agent = await prisma.agent.findFirst({
      where: {
        id: agentId,
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
      throw new Error("Agent not found");
    }

    return { success: true, data: agent };
  } catch (error: any) {
    console.error("Error fetching agent:", error);
    return { success: false, error: error.message || "Failed to fetch agent" };
  }
}

