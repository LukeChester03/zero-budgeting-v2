"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFirebaseStore } from "@/lib/store-firebase";
import { useToast } from "@/hooks/use-toast";

interface SaveTemplateModalProps {
  open: boolean;
  onClose: () => void;
  currentAllocations: { category: string; amount: number }[];
}

export default function SaveTemplateModal({ open, onClose, currentAllocations }: SaveTemplateModalProps) {
  const [templateName, setTemplateName] = useState("");
  const { addBudgetTemplate } = useFirebaseStore();
  const { toast } = useToast();

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a template name",
        variant: "destructive",
      });
      return;
    }

    try {
      // Convert allocations to categories array
      const categories = currentAllocations.map(alloc => alloc.category);
      
      await addBudgetTemplate({
        title: templateName.trim(),
        categories,
        isDefault: false
      });

      toast({
        title: "Success",
        description: `Template "${templateName}" saved successfully!`,
      });

      setTemplateName("");
      onClose();
    } catch (error) {
      console.error('Error saving template:', error);
      toast({
        title: "Error",
        description: "Failed to save template. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSaveTemplate();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Save Budget Template</DialogTitle>
          <DialogDescription>
            Save your current budget allocations as a reusable template for future budgets.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="template-name">Template Name</Label>
            <Input
              id="template-name"
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="e.g. My Monthly Budget"
              autoFocus
            />
          </div>
          
          <div className="space-y-2">
            <Label>Categories in this template:</Label>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {currentAllocations.map((alloc) => (
                <div key={alloc.category} className="flex justify-between items-center text-sm">
                  <span>{alloc.category}</span>
                  <span className="text-muted-foreground">£{alloc.amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSaveTemplate} disabled={!templateName.trim()}>
            Save Template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 