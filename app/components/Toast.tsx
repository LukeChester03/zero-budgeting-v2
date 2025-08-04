"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ToastProps {
  id: string;
  title: string;
  description?: string;
  variant?: "default" | "destructive";
  action?: React.ReactNode;
  onDismiss: (id: string) => void;
}

export function Toast({ id, title, description, variant = "default", action, onDismiss }: ToastProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.3 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
      className={cn(
        "w-full max-w-xs sm:max-w-sm bg-white rounded-lg shadow-lg border p-3 sm:p-4",
        variant === "destructive" && "border-red-200 bg-red-50",
        variant === "default" && "border-gray-200"
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h3 className={cn(
            "font-semibold text-xs sm:text-sm",
            variant === "destructive" ? "text-red-800" : "text-gray-900"
          )}>
            {title}
          </h3>
          {description && (
            <p className={cn(
              "text-xs sm:text-sm mt-1",
              variant === "destructive" ? "text-red-600" : "text-gray-600"
            )}>
              {description}
            </p>
          )}
          {action && (
            <div className="mt-2 sm:mt-3">
              {action}
            </div>
          )}
        </div>
        <button
          onClick={() => onDismiss(id)}
          className={cn(
            "ml-2 sm:ml-4 p-1 rounded-md hover:bg-gray-100 transition-colors flex-shrink-0",
            variant === "destructive" && "hover:bg-red-100"
          )}
        >
          <X className="h-3 w-3 sm:h-4 sm:w-4" />
        </button>
      </div>
    </motion.div>
  );
}

interface ToasterProps {
  toasts: Array<{
    id: string;
    title: string;
    description?: string;
    variant?: "default" | "destructive";
    action?: React.ReactNode;
  }>;
  onDismiss: (id: string) => void;
}

export function Toaster({ toasts, onDismiss }: ToasterProps) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-xs sm:max-w-sm">
      <AnimatePresence>
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            {...toast}
            onDismiss={onDismiss}
          />
        ))}
      </AnimatePresence>
    </div>
  );
} 