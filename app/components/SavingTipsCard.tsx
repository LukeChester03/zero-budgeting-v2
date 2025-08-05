import React from "react";
import { motion, Variants } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Lightbulb, Star, CheckCircle } from "lucide-react";


// Animation variants
const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 200, damping: 20 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
  hover: { scale: 1.02, backgroundColor: "rgba(229, 231, 235, 0.5)" },
};

// Static savings tips
const tips: string[] = [
  "Automate your savings: set up recurring transfers each payday.",
  "Round up your purchases to the nearest pound and save the difference.",
  "Review subscriptions monthly and cancel those you don't use.",
  "Use cashback and reward apps for everyday spending.",
  "Set clear targets: small, achievable milestones boost motivation.",
];

export default function SavingsTipsCard() {
  // Select a random tip as "Tip of the Day"
  const tipOfTheDay = tips[Math.floor(Math.random() * tips.length)];

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      className="h-full"
    >
      <Card className="h-full shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Lightbulb className="h-5 w-5 text-primary" />
            Savings Tips
            <Badge variant="secondary" className="ml-2">
              {tips.length} tips
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col h-full space-y-4">
          <div className="flex-1 space-y-3 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            <motion.div
              variants={itemVariants}
              className="p-4 rounded-lg bg-primary/10 border border-primary/20"
            >
              <div className="flex items-start gap-3">
                <Star className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="text-foreground text-sm font-medium mb-1">
                    Tip of the Day
                  </p>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {tipOfTheDay}
                  </p>
                </div>
              </div>
            </motion.div>

            <Separator />

            {tips.map((tip, idx) => (
              <motion.div
                key={idx}
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                whileHover="hover"
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                role="listitem"
              >
                <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-muted-foreground text-sm leading-relaxed">{tip}</p>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
