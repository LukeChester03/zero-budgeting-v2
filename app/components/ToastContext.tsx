"use client";

import React, { createContext, useContext } from "react";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "./Toast";

const ToastContext = createContext<ReturnType<typeof useToast> | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const toast = useToast();
  
  return (
    <ToastContext.Provider value={toast}>
      {children}
      <Toaster toasts={toast.toasts} onDismiss={toast.dismiss} />
    </ToastContext.Provider>
  );
}

export function useToastContext() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToastContext must be used within a ToastProvider");
  }
  return context;
} 