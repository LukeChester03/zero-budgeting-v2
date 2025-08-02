"use client";

import { useEffect, useState } from "react";
import { CheckCircle, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface SuccessNotificationProps {
  message: string;
  isVisible: boolean;
  onClose: () => void;
}

export default function SuccessNotification({ 
  message, 
  isVisible, 
  onClose 
}: SuccessNotificationProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right-2 duration-300">
      <Alert className="border-green-200 bg-green-50 text-green-800 shadow-lg">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="flex items-center justify-between">
          <span>{message}</span>
          <button
            onClick={onClose}
            className="ml-2 rounded-full p-1 hover:bg-green-100 transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        </AlertDescription>
      </Alert>
    </div>
  );
} 