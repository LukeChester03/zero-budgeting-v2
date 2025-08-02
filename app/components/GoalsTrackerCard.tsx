import React, { useState, FormEvent, useEffect } from "react";
import { motion, Variants, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { Target, Trash2, Plus, Umbrella, Car, Home, PiggyBank, LifeBuoy } from "lucide-react";
import { useBudgetStore } from "@/app/lib/store";
import { cn } from "@/lib/utils";

// Progress bar animation
const barVariants: Variants = {
  hidden: { width: 0 },
  visible: (pct: number) => ({
    width: `${Math.min(pct, 100)}%`,
    transition: { duration: 0.8, ease: "easeOut" },
  }),
};

// Card animation
const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3 } },
  hover: { scale: 1.02, boxShadow: "0 8px 16px rgba(0, 0, 0, 0.1)" },
};

// Button animation
const buttonVariants: Variants = {
  hover: { scale: 1.05, boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)" },
  tap: { scale: 0.95 },
};

// Form input animation
const inputVariants: Variants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
};

// Icon map
const ICONS = {
  emergency: { icon: <LifeBuoy className="h-4 w-4" />, label: "Emergency" },
  vacation: { icon: <Umbrella className="h-4 w-4" />, label: "Vacation" },
  car: { icon: <Car className="h-4 w-4" />, label: "Car" },
  home: { icon: <Home className="h-4 w-4" />, label: "Home" },
  piggy: { icon: <PiggyBank className="h-4 w-4" />, label: "Savings" },
} as const;
type IconKey = keyof typeof ICONS;

interface FormState {
  title: string;
  target: string;
  icon: IconKey;
}

export default function GoalsTrackerCard() {
  const { goals, addGoal, deleteGoal, getSavedAmountForGoal, budgets } = useBudgetStore();
  const [formState, setFormState] = useState<FormState>({
    title: "",
    target: "",
    icon: "piggy",
  });
  const [errors, setErrors] = useState<{ title?: string; target?: string }>({});

  // Update saved amounts when budgets change
  useEffect(() => {
    goals.forEach((goal) => {
      const saved = getSavedAmountForGoal(goal.title);
      if (saved !== goal.saved) {
        useBudgetStore.getState().updateGoal(goal.id, { saved });
      }
    });
  }, [budgets, goals, getSavedAmountForGoal]);

  const validateForm = (): boolean => {
    const newErrors: { title?: string; target?: string } = {};
    if (!formState.title.trim()) {
      newErrors.title = "Goal title is required";
    } else if (goals.some((g) => g.title.toLowerCase() === formState.title.trim().toLowerCase())) {
      newErrors.title = "Goal title already exists";
    }
    const targetNum = parseFloat(formState.target);
    if (!formState.target || isNaN(targetNum) || targetNum <= 0) {
      newErrors.target = "Valid target amount is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddGoal = (e: FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    addGoal({
      title: formState.title.trim(),
      target: parseFloat(formState.target),
      iconKey: formState.icon,
    });
    setFormState({ title: "", target: "", icon: "piggy" });
    setErrors({});
  };

  const handleInputChange = (field: keyof FormState, value: string | IconKey) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
      }}
      className="w-full h-full"
    >
      <Card className="h-full shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Target className="h-5 w-5 text-primary" />
            Savings Goals
            <Badge variant="secondary" className="ml-2">
              {goals.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col h-full space-y-6">
          {/* Goals List */}
          <motion.div
            variants={cardVariants}
            className="flex-1 space-y-4 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 pr-2"
          >
            <AnimatePresence>
              {goals.length === 0 ? (
                <motion.div variants={cardVariants} className="text-center text-muted-foreground py-8">
                  No goals yet. Add one below!
                </motion.div>
              ) : (
                goals.map((goal) => {
                  const pct = (goal.saved / goal.target) * 100;
                  return (
                    <motion.div
                      key={goal.id}
                      variants={cardVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      whileHover="hover"
                      className="relative bg-muted/50 rounded-lg p-4 border border-border"
                    >
                      {/* Delete Button */}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute top-3 right-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Goal</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{goal.title}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteGoal(goal.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>

                      {/* Title & Amount */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <span className="text-primary">{ICONS[goal.iconKey].icon}</span>
                          <span className="font-semibold text-foreground">{goal.title}</span>
                        </div>
                        <span className="text-sm font-medium text-muted-foreground">
                          £{goal.saved.toFixed(2)} / £{goal.target.toFixed(2)}
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-2">
                        <Progress value={Math.min(pct, 100)} className="h-2" />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{pct.toFixed(1)}%</span>
                          <Badge variant={pct >= 100 ? "default" : "secondary"}>
                            {pct >= 100 ? "Complete!" : "In Progress"}
                          </Badge>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </AnimatePresence>
          </motion.div>

          <Separator />

          {/* Add Goal Form */}
          <motion.form
            onSubmit={handleAddGoal}
            variants={cardVariants}
            className="space-y-4"
          >
            <div className="space-y-4">
              {/* Title Input */}
              <motion.div variants={inputVariants} className="space-y-2">
                <Label htmlFor="goal-title">Goal Title</Label>
                <Input
                  id="goal-title"
                  type="text"
                  placeholder="e.g., Vacation Fund"
                  value={formState.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  className={cn(errors.title && "border-destructive")}
                  aria-invalid={!!errors.title}
                />
                {errors.title && <span className="text-xs text-destructive">{errors.title}</span>}
              </motion.div>

              {/* Target & Icon Container */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Target Input */}
                <motion.div variants={inputVariants} className="space-y-2">
                  <Label htmlFor="goal-target">Target Amount</Label>
                  <Input
                    id="goal-target"
                    type="number"
                    placeholder="0.00"
                    value={formState.target}
                    onChange={(e) => handleInputChange("target", e.target.value)}
                    className={cn(errors.target && "border-destructive")}
                    min="0"
                    step="0.01"
                    aria-invalid={!!errors.target}
                  />
                  {errors.target && <span className="text-xs text-destructive">{errors.target}</span>}
                </motion.div>

                {/* Icon Select */}
                <motion.div variants={inputVariants} className="space-y-2">
                  <Label htmlFor="goal-icon">Icon</Label>
                  <Select
                    value={formState.icon}
                    onValueChange={(value) => handleInputChange("icon", value as IconKey)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(ICONS).map(([key, { label, icon }]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-2">
                            {icon}
                            {label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </motion.div>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Goal
            </Button>
          </motion.form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
