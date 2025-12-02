import {
  getKnowledgeBase,
  createKnowledgeBase,
  trainFile,
  trainWebsite,
  resetKnowledgeBase,
} from "@/app/actions/knowledge-base";
import { uploadFileAction } from "@/app/actions/storage";
import { KnowledgeBaseForm } from "./knowledge-base-form";
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
  Upload,
  FileText,
  Globe,
  CheckCircle2,
  XCircle,
  Loader2,
  Plus,
  RotateCcw,
} from "lucide-react";
import { redirect } from "next/navigation";
import { ResetKnowledgeBaseButton } from "./reset-button";

export default async function KnowledgeBasePage() {
  const result = await getKnowledgeBase();
  const knowledgeBase = result.success ? result.data : null;

  async function createKnowledgeBaseAction(formData: FormData) {
    "use server";
    const result = await createKnowledgeBase({
      name: formData.get("name") as string,
      description: (formData.get("description") as string) || undefined,
    });

    if (result.success) {
      redirect("/dashboard/knowledge-base");
    } else {
      return result;
    }
  }

  async function trainFileAction(formData: FormData) {
    "use server";
    const file = formData.get("file") as File | null;
    
    if (!file || !(file instanceof File) || file.size === 0) {
      redirect("/dashboard/knowledge-base");
    }

    try {
      // Get organization ID
      const { requireOrganization } = await import("@/lib/organization");
      const organizationId = await requireOrganization();

      // Upload file first
      const uploadResult = await uploadFileAction({
        file,
        organizationId,
        isSecure: false,
      });

      if (!uploadResult.success || !uploadResult.data) {
        redirect("/dashboard/knowledge-base");
      }

      // Get file storage ID from the upload result
      const fileStorageId = uploadResult.data.fileStorageId;
      if (!fileStorageId) {
        redirect("/dashboard/knowledge-base");
      }

      // Train the file - the action handles everything including async upload
      // We don't await the result to avoid returning a value
      trainFile(fileStorageId).catch((error) => {
        console.error("Error training file:", error);
      });
    } catch (error: any) {
      // Log error - redirect will be called after catch block
      console.error("Error in trainFileAction:", error);
    }
    
    redirect("/dashboard/knowledge-base");
  }

  async function trainWebsiteAction(formData: FormData) {
    "use server";
    try {
      const url = formData.get("url") as string;
      if (!url || typeof url !== "string" || url.trim() === "") {
        redirect("/dashboard/knowledge-base");
      }

      // Validate URL format
      try {
        new URL(url);
      } catch {
        redirect("/dashboard/knowledge-base");
      }

      // Train the website - the action handles everything including async upload
      // We don't await the result to avoid returning a value
      trainWebsite(url).catch((error) => {
        console.error("Error training website:", error);
      });
    } catch (error) {
      // Log error but don't throw - redirect instead
      console.error("Error in trainWebsiteAction:", error);
    }
    
    redirect("/dashboard/knowledge-base");
  }


  if (!knowledgeBase) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div>
          <h1 className="text-2xl font-semibold">Knowledge Base</h1>
          <p className="text-muted-foreground">
            Initialize your organization&apos;s knowledge base
          </p>
        </div>
        <KnowledgeBaseForm action={createKnowledgeBaseAction} />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle>{knowledgeBase.name}</CardTitle>
              <CardDescription>
                {knowledgeBase.description || "No description"}
              </CardDescription>
            </div>
            <ResetKnowledgeBaseButton />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Status:</span>
              <span
                className={`font-medium ${
                  knowledgeBase.status === "READY"
                    ? "text-green-600 dark:text-green-400"
                    : knowledgeBase.status === "ERROR"
                      ? "text-destructive"
                      : "text-yellow-600 dark:text-yellow-400"
                }`}
              >
                {knowledgeBase.status}
              </span>
            </div>
            {knowledgeBase.vectorStoreId && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Vector Store ID:</span>
                <span className="font-mono text-xs">
                  {knowledgeBase.vectorStoreId}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Upload Files</CardTitle>
            <CardDescription>
              Upload files to train your knowledge base
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={trainFileAction} className="space-y-4" encType="multipart/form-data">
              <div className="space-y-2">
                <Label htmlFor="file">File</Label>
                <Input
                  id="file"
                  name="file"
                  type="file"
                  accept=".pdf,.txt,.doc,.docx,.md,.csv"
                  required
                />
                <p className="text-sm text-muted-foreground">
                  Supported formats: PDF, TXT, DOC, DOCX, MD, CSV
                </p>
              </div>
              <Button type="submit">
                <Upload className="size-4 mr-2" />
                Upload & Train
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Train Website</CardTitle>
            <CardDescription>
              Add website content to your knowledge base
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={trainWebsiteAction} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="url">Website URL</Label>
                <Input
                  id="url"
                  name="url"
                  type="url"
                  placeholder="https://example.com"
                  required
                />
              </div>
              <Button type="submit">
                <Globe className="size-4 mr-2" />
                Train Website
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold mb-4">Training History</h2>

          {knowledgeBase.trainingFiles.length > 0 && (
            <Card className="mb-4">
              <CardHeader>
                <CardTitle>Files</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {knowledgeBase.trainingFiles.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-3 border rounded-md"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="size-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">
                            {file.fileStorage.fileName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {file.fileStorage.fileSize
                              ? `${(file.fileStorage.fileSize / 1024).toFixed(2)} KB`
                              : "Unknown size"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {file.status === "COMPLETED" && (
                          <CheckCircle2 className="size-5 text-green-600" />
                        )}
                        {file.status === "FAILED" && (
                          <XCircle className="size-5 text-destructive" />
                        )}
                        {file.status === "PROCESSING" && (
                          <Loader2 className="size-5 animate-spin text-yellow-600" />
                        )}
                        <span className="text-sm text-muted-foreground">
                          {file.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {knowledgeBase.trainingWebsites.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Websites</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {knowledgeBase.trainingWebsites.map((website) => (
                    <div
                      key={website.id}
                      className="flex items-center justify-between p-3 border rounded-md"
                    >
                      <div className="flex items-center gap-3">
                        <Globe className="size-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{website.url}</p>
                          {website.processedAt && (
                            <p className="text-sm text-muted-foreground">
                              Processed:{" "}
                              {new Date(website.processedAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {website.status === "COMPLETED" && (
                          <CheckCircle2 className="size-5 text-green-600" />
                        )}
                        {website.status === "FAILED" && (
                          <XCircle className="size-5 text-destructive" />
                        )}
                        {website.status === "PROCESSING" && (
                          <Loader2 className="size-5 animate-spin text-yellow-600" />
                        )}
                        <span className="text-sm text-muted-foreground">
                          {website.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {knowledgeBase.trainingFiles.length === 0 &&
            knowledgeBase.trainingWebsites.length === 0 && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="size-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    No training data yet
                  </h3>
                  <p className="text-muted-foreground text-center">
                    Upload files or add websites to start training your
                    knowledge base
                  </p>
                </CardContent>
              </Card>
            )}
        </div>
      </div>
    </div>
  );
}

