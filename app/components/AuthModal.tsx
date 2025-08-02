"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Mail, Lock, User, Eye, EyeOff, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import SuccessNotification from "./SuccessNotification";
import { loginSchema, registerSchema, type LoginFormData, type RegisterFormData } from "@/lib/validation/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [authError, setAuthError] = useState("");
  const { signIn, signUp, signInWithGoogle, error, clearError } = useAuth();

  // Form setup with react-hook-form and zod validation
  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      displayName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const currentForm = isSignUp ? registerForm : loginForm;

  const handleSubmit = async (data: LoginFormData | RegisterFormData) => {
    setAuthError("");
    clearError();
    setIsLoading(true);

    try {
      if (isSignUp) {
        const registerData = data as RegisterFormData;
        console.log("Attempting to sign up with:", { email: registerData.email, displayName: registerData.displayName });
        await signUp(registerData.email, registerData.password, registerData.displayName);
        setSuccessMessage("Account created successfully! Please check your email for verification.");
        setShowSuccess(true);
        setTimeout(() => {
          onClose();
          resetForm();
        }, 2000);
      } else {
        const loginData = data as LoginFormData;
        console.log("Attempting to sign in with:", { email: loginData.email });
        await signIn(loginData.email, loginData.password);
        setSuccessMessage("Welcome back! You've been successfully signed in.");
        setShowSuccess(true);
        onClose();
        resetForm();
      }
    } catch (error: any) {
      console.error("Authentication error:", error);
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);
      
      // Handle specific Firebase auth errors
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        setAuthError("Incorrect email or password");
      } else if (error.code === 'auth/email-already-in-use') {
        setAuthError("An account with this email already exists");
      } else if (error.code === 'auth/weak-password') {
        setAuthError("Password should be at least 6 characters long");
      } else if (error.code === 'auth/invalid-email') {
        setAuthError("Please enter a valid email address");
      } else {
        setAuthError(`An error occurred: ${error.message || error.code || 'Unknown error'}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthError("");
    clearError();
    setIsLoading(true);

    try {
      console.log("Attempting Google sign-in");
      await signInWithGoogle();
      setSuccessMessage("Welcome! You've been successfully signed in with Google.");
      setShowSuccess(true);
      onClose();
      resetForm();
    } catch (error: any) {
      console.error("Google sign-in error:", error);
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);
      
      if (error.code === 'auth/popup-closed-by-user') {
        setAuthError("Sign-in was cancelled");
      } else if (error.code === 'auth/popup-blocked') {
        setAuthError("Pop-up was blocked. Please allow pop-ups for this site");
      } else {
        setAuthError(`Google sign-in error: ${error.message || error.code || 'Unknown error'}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    loginForm.reset();
    registerForm.reset();
    setShowPassword(false);
    setShowConfirmPassword(false);
    setSuccessMessage("");
    setShowSuccess(false);
    setAuthError("");
    clearError();
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setAuthError("");
    clearError();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md border-0 shadow-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-2xl font-bold">
            {isSignUp ? "Create Account" : "Welcome Back"}
          </DialogTitle>
          <DialogDescription>
            {isSignUp
              ? "Sign up to start managing your finances with Zero Budget"
              : "Sign in to access your budget dashboard"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {(error || authError) && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{authError || error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={currentForm.handleSubmit(handleSubmit)} className="space-y-4">
            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="displayName" className="text-sm font-medium">
                  Full Name
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    {...registerForm.register("displayName")}
                    type="text"
                    placeholder="Enter your full name"
                    className={`pl-10 transition-all duration-200 focus:ring-2 focus:ring-primary/20 ${
                      registerForm.formState.errors.displayName ? "border-red-500" : ""
                    }`}
                  />
                </div>
                {registerForm.formState.errors.displayName && (
                  <p className="text-xs text-red-500 mt-1">
                    {registerForm.formState.errors.displayName.message}
                  </p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  {...currentForm.register("email")}
                  type="email"
                  placeholder="Enter your email"
                  className={`pl-10 transition-all duration-200 focus:ring-2 focus:ring-primary/20 ${
                    currentForm.formState.errors.email ? "border-red-500" : ""
                  }`}
                />
              </div>
              {currentForm.formState.errors.email && (
                <p className="text-xs text-red-500 mt-1">
                  {currentForm.formState.errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  {...currentForm.register("password")}
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  className={`pl-10 pr-10 transition-all duration-200 focus:ring-2 focus:ring-primary/20 ${
                    currentForm.formState.errors.password ? "border-red-500" : ""
                  }`}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              {currentForm.formState.errors.password && (
                <p className="text-xs text-red-500 mt-1">
                  {currentForm.formState.errors.password.message}
                </p>
              )}
            </div>

            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    {...registerForm.register("confirmPassword")}
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    className={`pl-10 pr-10 transition-all duration-200 focus:ring-2 focus:ring-primary/20 ${
                      registerForm.formState.errors.confirmPassword ? "border-red-500" : ""
                    }`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                {registerForm.formState.errors.confirmPassword && (
                  <p className="text-xs text-red-500 mt-1">
                    {registerForm.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>
            )}

            <Button
              type="submit"
              className="w-full transition-all duration-200 hover:scale-[1.02]"
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSignUp ? "Create Account" : "Sign In"}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full transition-all duration-200 hover:scale-[1.02]"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Google
          </Button>

          <div className="text-center">
            <Button
              type="button"
              variant="link"
              onClick={toggleMode}
              className="text-sm hover:text-primary transition-colors"
            >
              {isSignUp
                ? "Already have an account? Sign in"
                : "Don't have an account? Sign up"}
            </Button>
          </div>

          {isSignUp && (
            <div className="rounded-lg bg-muted/50 p-3">
              <div className="flex items-start gap-2">
                <Badge variant="secondary" className="text-xs">
                  <Lock className="mr-1 h-3 w-3" />
                  Secure
                </Badge>
                <p className="text-xs text-muted-foreground">
                  Your data is encrypted and stored securely. We'll send you a verification email after signup.
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
      
      <SuccessNotification
        message={successMessage}
        isVisible={showSuccess}
        onClose={() => setShowSuccess(false)}
      />
    </Dialog>
  );
} 