"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";

const agentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  systemPrompt: z.string().optional(),
  model: z.string().default("gpt-4"),
  temperature: z.coerce.number().min(0).max(2).default(0.7),
  maxTokens: z.coerce.number().optional(),
  knowledgeBaseId: z.string().optional(),
});

type AgentFormValues = z.infer<typeof agentSchema>;

interface AgentFormProps {
  action: (formData: FormData) => Promise<any>;
  knowledgeBase: {
    id: string;
    name: string;
    status: string;
  } | null;
  defaultValues: AgentFormValues | null;
}

export function AgentForm({
  action,
  knowledgeBase,
  defaultValues,
}: AgentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<AgentFormValues>({
    resolver: zodResolver(agentSchema),
    defaultValues: defaultValues || {
      name: "",
      description: "",
      systemPrompt: "",
      model: "gpt-4",
      temperature: 0.7,
      maxTokens: undefined,
      knowledgeBaseId: knowledgeBase?.id || "",
    },
  });

  const selectedKnowledgeBase = watch("knowledgeBaseId");

  const onSubmit = async (data: AgentFormValues) => {
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        formData.append(key, String(value));
      }
    });

    try {
      const result = await action(formData);
      if (result && result.error) {
        setError(result.error);
      }
    } catch (err: any) {
      setError(err.message || "Failed to save agent");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Card>
        <CardHeader>
          <CardTitle>Agent Configuration</CardTitle>
          <CardDescription>
            Configure your AI agent settings and behavior
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              {...register("name")}
              placeholder="My AI Agent"
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="A brief description of what this agent does"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="systemPrompt">System Prompt</Label>
            <Textarea
              id="systemPrompt"
              {...register("systemPrompt")}
              placeholder="You are a helpful assistant..."
              rows={5}
            />
            <p className="text-sm text-muted-foreground">
              Define the agent&apos;s behavior and personality
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="model">Model</Label>
              <Select
                defaultValue={watch("model")}
                onValueChange={(value) => setValue("model", value)}
              >
                <SelectTrigger id="model">
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gpt-4">GPT-4</SelectItem>
                  <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                  <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="temperature">Temperature</Label>
              <Input
                id="temperature"
                type="number"
                step="0.1"
                min="0"
                max="2"
                {...register("temperature")}
              />
              <p className="text-sm text-muted-foreground">
                Controls randomness (0-2)
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxTokens">Max Tokens (Optional)</Label>
            <Input
              id="maxTokens"
              type="number"
              {...register("maxTokens")}
              placeholder="Leave empty for default"
            />
          </div>

          {knowledgeBase && (
            <div className="space-y-2">
              <Label htmlFor="knowledgeBaseId">Knowledge Base</Label>
              <Select
                value={selectedKnowledgeBase || ""}
                onValueChange={(value) => setValue("knowledgeBaseId", value)}
              >
                <SelectTrigger id="knowledgeBaseId">
                  <SelectValue placeholder="Select knowledge base" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={knowledgeBase.id}>
                    {knowledgeBase.name} ({knowledgeBase.status})
                  </SelectItem>
                  <SelectItem value="">None</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Connect this agent to your organization&apos;s knowledge base
              </p>
            </div>
          )}

          <div className="flex gap-4 pt-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Agent"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => window.history.back()}
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}

