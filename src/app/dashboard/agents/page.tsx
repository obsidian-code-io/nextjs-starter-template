import { getAgents } from "@/app/actions/agent";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { Plus, Bot, Database, Trash2, Edit } from "lucide-react";
import { deleteAgent } from "@/app/actions/agent";
import { redirect } from "next/navigation";

export default async function AgentsPage() {
  const result = await getAgents();
  const agents = result.success ? result.data : [];

  async function handleDelete(formData: FormData) {
    "use server";
    const agentId = formData.get("agentId") as string;
    if (agentId) {
      await deleteAgent(agentId);
      redirect("/dashboard/agents");
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Agents</h1>
          <p className="text-muted-foreground">
            Create and manage AI agents for your organization
          </p>
        </div>
        <Link href="/dashboard/agents/new">
          <Button>
            <Plus className="size-4" />
            Create Agent
          </Button>
        </Link>
      </div>

      {agents.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bot className="size-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No agents yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Get started by creating your first AI agent
            </p>
            <Link href="/dashboard/agents/new">
              <Button>
                <Plus className="size-4" />
                Create Your First Agent
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent) => (
            <Card key={agent.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      <Bot className="size-5" />
                      {agent.name}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {agent.description || "No description"}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-1">
                    <form action={handleDelete}>
                      <input type="hidden" name="agentId" value={agent.id} />
                      <Button
                        type="submit"
                        variant="ghost"
                        size="icon-sm"
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </form>
                    <Link href={`/dashboard/agents/${agent.id}`}>
                      <Button variant="ghost" size="icon-sm">
                        <Edit className="size-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Model:</span>
                    <span className="font-medium">{agent.model}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Temperature:</span>
                    <span className="font-medium">{agent.temperature}</span>
                  </div>
                  {agent.knowledgeBase && (
                    <div className="flex items-center gap-2 text-sm pt-2 border-t">
                      <Database className="size-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        Knowledge Base:
                      </span>
                      <span className="font-medium">
                        {agent.knowledgeBase.name}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm pt-2 border-t">
                    <span className="text-muted-foreground">Status:</span>
                    <span
                      className={`font-medium ${
                        agent.isActive
                          ? "text-green-600 dark:text-green-400"
                          : "text-muted-foreground"
                      }`}
                    >
                      {agent.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

