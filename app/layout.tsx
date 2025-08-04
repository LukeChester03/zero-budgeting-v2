import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "./components/Header";
import { AuthProvider } from "@/lib/auth-context";
import { ToastProvider } from "./components/ToastContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Zero Budgeting - Take Control of Your Finances",
  description: "Intelligent budgeting, goal tracking, and debt management. Every penny has a purpose.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AuthProvider>
          <ToastProvider>
            <Header />
            <main className="mt-4 sm:mt-6">{children}</main>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
