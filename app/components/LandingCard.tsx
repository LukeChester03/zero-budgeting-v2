"use client";

import React, { ReactNode } from "react";
import Link from "next/link";
import { motion, Variants } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";


type LandingCardProps = {
  title: string;
  description?: string;
  icon?: ReactNode;
  /** If provided, renders as a `<Link>`; otherwise falls back to `onClick` button behavior. */
  href?: string;
  onClick?: () => void;
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 200, damping: 20 },
  },
  hover: { scale: 1.02, boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)" },
  tap: { scale: 0.98 },
};

export const LandingCard: React.FC<LandingCardProps> = ({
  title,
  description,
  icon,
  href,
  onClick,
}) => {
  const content = (
    <Card className="h-full cursor-pointer transition-all duration-300 hover:shadow-lg border-border hover:border-primary/20">
      <CardContent className="p-8 flex flex-col items-center justify-center text-center space-y-4">
        {icon && (
          <div className="text-primary text-6xl mb-2">
            {icon}
          </div>
        )}
        <h3 className="text-2xl font-bold text-foreground">{title}</h3>
        {description && (
          <p className="text-muted-foreground leading-relaxed">
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  );

  // 1️⃣ If `href` is provided, render as a prefetched Next <Link>
  if (href) {
    return (
      <Link href={href} passHref>
        <motion.div
          variants={cardVariants}
          initial="hidden"
          whileHover="hover"
          whileTap="tap"
          animate="visible"
          className="block w-full h-full"
        >
          {content}
        </motion.div>
      </Link>
    );
  }

  // 2️⃣ Otherwise, fallback to button-like div with onClick
  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      whileHover="hover"
      whileTap="tap"
      animate="visible"
      className="block w-full h-full"
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (onClick && (e.key === "Enter" || e.key === " ")) {
          onClick();
        }
      }}
      aria-label={title}
    >
      {content}
    </motion.div>
  );
};

export default LandingCard;
