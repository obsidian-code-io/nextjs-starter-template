import { createAgent, getKnowledgeBase } from "@/app/actions/agent";
import { getKnowledgeBase as getKB } from "@/app/actions/knowledge-base";
import { AgentForm } from "./agent-form";
import { redirect } from "next/navigation";

export default async function NewAgentPage() {
  const kbResult = await getKB();
  const knowledgeBase = kbResult.success ? kbResult.data : null;

  async function createAgentAction(formData: FormData) {
    "use server";
    const result = await createAgent({
      name: formData.get("name") as string,
      description: (formData.get("description") as string) || undefined,
      systemPrompt: (formData.get("systemPrompt") as string) || undefined,
      model: (formData.get("model") as string) || "gpt-4",
      temperature: formData.get("temperature")
        ? parseFloat(formData.get("temperature") as string)
        : 0.7,
      maxTokens: formData.get("maxTokens")
        ? parseInt(formData.get("maxTokens") as string)
        : undefined,
      knowledgeBaseId: (formData.get("knowledgeBaseId") as string) || undefined,
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
        <h1 className="text-2xl font-semibold">Create New Agent</h1>
        <p className="text-muted-foreground">
          Configure your AI agent with custom settings and knowledge base
        </p>
      </div>
      <AgentForm
        action={createAgentAction}
        knowledgeBase={knowledgeBase}
        defaultValues={null}
      />
    </div>
  );
}

