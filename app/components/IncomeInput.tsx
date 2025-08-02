"use client";

import { useBudgetStore } from "@/app/lib/store";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Lock, Unlock, Save, PoundSterling } from "lucide-react";
import { cn } from "@/lib/utils";

export default function IncomeInput() {
  const income = useBudgetStore((state) => state.income);
  const incomeLocked = useBudgetStore((state) => state.incomeLocked);
  const updateIncome = useBudgetStore((state) => state.updateIncome);
  const setIncomeLocked = useBudgetStore((state) => state.setIncomeLocked);

  const [input, setInput] = useState(income);

  useEffect(() => {
    setInput(income);
  }, [income]);

  const handleSave = () => {
    updateIncome(input);
    setIncomeLocked(true);
  };

  const handleChangeIncome = () => {
    setIncomeLocked(false);
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PoundSterling className="h-5 w-5 text-primary" />
          Monthly Income
          {incomeLocked && (
            <Badge variant="secondary" className="ml-2">
              <Lock className="h-3 w-3 mr-1" />
              Locked
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="income-input">Enter your monthly income</Label>
          <div className="flex items-center gap-4">
            <Input
              id="income-input"
              type="number"
              value={input}
              onChange={(e) => setInput(parseFloat(e.target.value) || 0)}
              disabled={incomeLocked}
              className={cn(
                "text-lg",
                incomeLocked && "opacity-70 cursor-not-allowed"
              )}
              placeholder="Enter your monthly income"
            />

            {incomeLocked ? (
              <Button
                onClick={handleChangeIncome}
                variant="outline"
                className="bg-amber-500 hover:bg-amber-600 text-white border-amber-500"
              >
                <Unlock className="h-4 w-4 mr-2" />
                Change
              </Button>
            ) : (
              <Button
                onClick={handleSave}
                className="bg-primary hover:bg-primary/90"
              >
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
