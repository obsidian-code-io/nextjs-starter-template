import { getAgent, updateAgent } from "@/app/actions/agent";
import { getKnowledgeBase } from "@/app/actions/knowledge-base";
import { AgentForm } from "../new/agent-form";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";

export default async function EditAgentPage({
  params,
}: {
  params: { id: string };
}) {
  const agentResult = await getAgent(params.id);
  if (!agentResult.success || !agentResult.data) {
    notFound();
  }

  const agent = agentResult.data;
  const kbResult = await getKnowledgeBase();
  const knowledgeBase = kbResult.success ? kbResult.data : null;

  async function updateAgentAction(formData: FormData) {
    "use server";
    const result = await updateAgent({
      id: params.id,
      name: formData.get("name") as string,
      description: (formData.get("description") as string) || undefined,
      systemPrompt: (formData.get("systemPrompt") as string) || undefined,
      model: (formData.get("model") as string) || "gpt-4",
      temperature: formData.get("temperature")
        ? parseFloat(formData.get("temperature") as string)
        : undefined,
      maxTokens: formData.get("maxTokens")
        ? parseInt(formData.get("maxTokens") as string)
        : undefined,
      knowledgeBaseId: (formData.get("knowledgeBaseId") as string) || null,
      isActive: formData.get("isActive") === "true",
    });

    if (result.success) {
      redirect("/dashboard/agents");
    } else {
      return result;
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div>
        <h1 className="text-2xl font-semibold">Edit Agent</h1>
        <p className="text-muted-foreground">
          Update your AI agent configuration
        </p>
      </div>
      <AgentForm
        action={updateAgentAction}
        knowledgeBase={knowledgeBase}
        defaultValues={{
          name: agent.name,
          description: agent.description || "",
          systemPrompt: agent.systemPrompt || "",
          model: agent.model,
          temperature: agent.temperature,
          maxTokens: agent.maxTokens || undefined,
          knowledgeBaseId: agent.knowledgeBaseId || "",
        }}
      />
    </div>
  );
}

