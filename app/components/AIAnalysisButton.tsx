"use client";

import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain } from "lucide-react";
import { useAIStore } from "@/lib/store/ai-store";
import { useRouter } from "next/navigation";

interface AIAnalysisButtonProps {
  itemVariants: any;
}

export default function AIAnalysisButton({ itemVariants }: AIAnalysisButtonProps) {
  const router = useRouter();
  const hasExistingAnalysis = useAIStore((s) => s.hasExistingAnalysis);

  console.log('🔍 AIAnalysisButton - hasExistingAnalysis:', hasExistingAnalysis);

  if (!hasExistingAnalysis) {
    console.log('❌ AIAnalysisButton - No existing analysis, not rendering');
    return null;
  }

  console.log('✅ AIAnalysisButton - Rendering button');

  return (
    <motion.div variants={itemVariants} className="mb-8 sm:mb-12 mt-8 sm:mt-12">
      <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20">
        <CardContent className="p-6 sm:p-8 text-center">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Brain className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-blue-700">Your AI Financial Analysis is Ready!</h3>
            </div>
            <p className="text-muted-foreground mb-6">
              View your personalized financial insights and recommendations based on your questionnaire responses.
            </p>
            <Button 
              size="lg" 
              onClick={() => router.push('/ai-analysis')} 
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Brain className="h-4 w-4 mr-2" />
              View AI Analysis
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
