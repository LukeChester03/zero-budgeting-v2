"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Edit } from "lucide-react";
import { useFirebaseStore } from "@/lib/store-firebase";
import { useToast } from "@/hooks/use-toast";
import AddCategoryModal from "./AddCategoryModal";

interface CustomCategoryManagerProps {
  section: string;
  title: string;
}

export default function CustomCategoryManager({ section, title }: CustomCategoryManagerProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [isRemoving, setIsRemoving] = useState<string | null>(null);
  
  const { getCustomCategories, addCustomCategory, removeCustomCategory } = useFirebaseStore();
  const { toast } = useToast();
  
  const categories = getCustomCategories(section);

  const handleAddCategory = async (name: string) => {
    try {
      await addCustomCategory(section, name);
      setModalOpen(false);
      toast({
        title: "Success",
        description: `Category "${name}" added successfully!`,
      });
    } catch (error) {
      console.error('Error adding custom category:', error);
      toast({
        title: "Error",
        description: "Failed to add custom category. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRemoveCategory = async (categoryName: string) => {
    try {
      setIsRemoving(categoryName);
      await removeCustomCategory(section, categoryName);
      toast({
        title: "Success",
        description: `Category "${categoryName}" removed successfully!`,
      });
    } catch (error) {
      console.error('Error removing custom category:', error);
      toast({
        title: "Error",
        description: "Failed to remove custom category. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRemoving(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setModalOpen(true)}
          className="h-7 px-2"
        >
          <Plus className="h-3 w-3 mr-1" />
          Add
        </Button>
      </div>
      
      {categories.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <Badge
              key={category}
              variant="secondary"
              className="flex items-center gap-1 px-2 py-1"
            >
              <span className="text-xs">{category}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                onClick={() => handleRemoveCategory(category)}
                disabled={isRemoving === category}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground italic">
          No custom categories added yet
        </p>
      )}

      <AddCategoryModal
        open={modalOpen}
        section={section}
        onClose={() => setModalOpen(false)}
        onConfirm={handleAddCategory}
      />
    </div>
  );
} 