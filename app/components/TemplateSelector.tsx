"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFirebaseStore } from "@/lib/store-firebase";
import { useToast } from "@/hooks/use-toast";
import { Bookmark, Download } from "lucide-react";

interface TemplateSelectorProps {
  onTemplateSelect: (categories: string[]) => void;
}

export default function TemplateSelector({ onTemplateSelect }: TemplateSelectorProps) {
  const { budgetTemplates } = useFirebaseStore();
  const { toast } = useToast();
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");

  const handleTemplateSelect = (templateId: string) => {
    const template = budgetTemplates.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplate(templateId);
      onTemplateSelect(template.categories);
      toast({
        title: "Template Loaded",
        description: `Loaded template: ${template.title}`,
      });
    }
  };

  const handleLoadDefaultTemplate = () => {
    // Find the default template (the one with isDefault: true)
    const defaultTemplate = budgetTemplates.find(t => t.isDefault);
    if (defaultTemplate) {
      setSelectedTemplate(defaultTemplate.id);
      onTemplateSelect(defaultTemplate.categories);
      toast({
        title: "Default Template Loaded",
        description: "Loaded the default budget template",
      });
    }
  };

  // Filter out default templates for the dropdown (only show custom templates)
  const customTemplates = budgetTemplates.filter(t => !t.isDefault);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Bookmark className="h-4 w-4" />
        <span className="text-sm font-medium">Load Template</span>
      </div>
      
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleLoadDefaultTemplate}
          className="flex items-center gap-2"
        >
          <Download className="h-3 w-3" />
          Default Template
        </Button>
        
        {customTemplates.length > 0 && (
          <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select custom template..." />
            </SelectTrigger>
            <SelectContent>
              {customTemplates.map((template) => (
                <SelectItem key={template.id} value={template.id}>
                  {template.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
      
      {customTemplates.length === 0 && (
        <p className="text-xs text-muted-foreground">
          No custom templates available. Save your current budget as a template to see it here.
        </p>
      )}
    </div>
  );
} 