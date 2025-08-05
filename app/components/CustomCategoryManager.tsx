"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useFirebaseStore } from "@/lib/store-firebase";
import { useToast } from "@/hooks/use-toast";
import AddCategoryModal from "./AddCategoryModal";

interface CustomCategoryManagerProps {
  section: string;
  title: string;
}

export default function CustomCategoryManager({ section, title }: CustomCategoryManagerProps) {
  const [modalOpen, setModalOpen] = useState(false);

  
  const { getCustomCategories, addCustomCategory } = useFirebaseStore();
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
      
      {categories.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {categories.length} custom categor{categories.length === 1 ? 'y' : 'ies'} added
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