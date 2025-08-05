"use client";

import React, { useState } from "react";
import { motion, Variants } from "framer-motion";
import { NavItem } from "@/app/components/NavItem";
import { FaMoneyBillWave } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { NavigationMenu, NavigationMenuItem, NavigationMenuLink, NavigationMenuList } from "@/components/ui/navigation-menu";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth-context";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Settings, LogOut, Shield, Menu, X } from "lucide-react";
import AuthModal from "./AuthModal";

// Entry animation for header
const headerVariants: Variants = {
  hidden: { opacity: 0, y: -20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function Header() {
  const { user, isLoading, signOut } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { label: "Home", path: "/" },
    { label: "Past Budgets", path: "/previous-budgets" },
    { label: "Create Budget", path: "/budget" },
    { label: "View Savings", path: "/savings" },
    { label: "View Debts", path: "/loans" },
    { label: "Bank Statements", path: "/bank-statements" },
  ];

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut();
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const getUserInitials = (user: { displayName?: string | null; email?: string | null }) => {
    if (user.displayName) {
      return user.displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase();
    }
    return user.email?.charAt(0).toUpperCase() || 'U';
  };

  return (
    <motion.header
      variants={headerVariants}
      initial="hidden"
      animate="visible"
      className="bg-background border-b border-border shadow-sm sticky top-0 z-50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            <div className="flex items-center space-x-2">
              <FaMoneyBillWave className="text-2xl sm:text-3xl text-primary" aria-hidden="true" />
              <span className="text-lg sm:text-xl font-bold text-foreground">Zero Budget</span>
            </div>
            <Badge variant="secondary" className="hidden sm:inline-flex text-xs">
              Beta
            </Badge>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-6">
            {user && (
              <NavigationMenu>
                <NavigationMenuList>
                  {navItems.map(({ label, path }) => (
                    <NavigationMenuItem key={path}>
                      <NavigationMenuLink asChild>
                        <NavItem href={path}>
                          {label}
                        </NavItem>
                      </NavigationMenuLink>
                    </NavigationMenuItem>
                  ))}
                </NavigationMenuList>
              </NavigationMenu>
            )}
          </nav>

          {/* User Menu / Auth */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.photoURL || undefined} alt={user.displayName || user.email || "User"} />
                      <AvatarFallback>{getUserInitials(user)}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.displayName || "User"}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                      {!user.emailVerified && (
                        <Badge variant="secondary" className="w-fit mt-1">
                          <Shield className="h-3 w-3 mr-1" />
                          Unverified
                        </Badge>
                      )}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <NavItem href="/profile">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </NavItem>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} disabled={isLoggingOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>{isLoggingOut ? "Signing out..." : "Sign out"}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsAuthModalOpen(true)}
                disabled={isLoading}
                className="hidden sm:inline-flex"
              >
                {isLoading ? "Loading..." : "Sign In"}
              </Button>
            )}
            
            {/* Mobile Menu Button */}
            <div className="lg:hidden">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2"
              >
                {isMobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="lg:hidden border-t border-border bg-background"
        >
          <div className="px-4 py-4 space-y-3">
            {user ? (
              <>
                {/* User Info */}
                <div className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.photoURL || undefined} alt={user.displayName || user.email || "User"} />
                    <AvatarFallback>{getUserInitials(user)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{user.displayName || "User"}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                </div>

                {/* Navigation Items */}
                <nav className="space-y-1">
                  {navItems.map(({ label, path }) => (
                    <div key={path} onClick={() => setIsMobileMenuOpen(false)}>
                      <NavItem href={path}>
                        {label}
                      </NavItem>
                    </div>
                  ))}
                </nav>

                {/* Mobile User Actions */}
                <div className="pt-3 border-t border-border">
                  <div className="space-y-1">
                    <div onClick={() => setIsMobileMenuOpen(false)}>
                      <NavItem href="/profile">
                        <User className="mr-3 h-4 w-4" />
                        Profile
                      </NavItem>
                    </div>
                    <Button
                      variant="ghost"
                      className="w-full justify-start px-3 py-2 h-auto"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        // Add settings functionality
                      }}
                    >
                      <Settings className="mr-3 h-4 w-4" />
                      Settings
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start px-3 py-2 h-auto text-destructive hover:text-destructive"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        handleLogout();
                      }}
                      disabled={isLoggingOut}
                    >
                      <LogOut className="mr-3 h-4 w-4" />
                      {isLoggingOut ? "Signing out..." : "Sign out"}
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground px-3">Sign in to access your budgets</p>
                <Button 
                  variant="default" 
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setIsAuthModalOpen(true);
                  }}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? "Loading..." : "Sign In"}
                </Button>
              </div>
            )}
          </div>
        </motion.div>
      )}
      
      <AuthModal 
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </motion.header>
  );
}
