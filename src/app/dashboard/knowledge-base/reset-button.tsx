"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { RotateCcw } from "lucide-react";
import { resetKnowledgeBase } from "@/app/actions/knowledge-base";
import { useRouter } from "next/navigation";

export function ResetKnowledgeBaseButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const router = useRouter();

  const handleReset = async () => {
    setIsResetting(true);
    try {
      const result = await resetKnowledgeBase();
      if (result.success) {
        setIsOpen(false);
        router.refresh();
      } else {
        alert(result.error || "Failed to reset knowledge base");
      }
    } catch (error: any) {
      alert(error.message || "Failed to reset knowledge base");
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="text-destructive hover:text-destructive"
        >
          <RotateCcw className="size-4 mr-2" />
          Reset
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reset Knowledge Base?</AlertDialogTitle>
          <AlertDialogDescription>
            This will delete all training files and websites from your knowledge
            base. This action cannot be undone. The vector store will be cleared
            but will remain available for new training data.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isResetting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleReset}
            disabled={isResetting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isResetting ? "Resetting..." : "Reset Knowledge Base"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

