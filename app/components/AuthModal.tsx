"use client";

import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle, User } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import validator from "validator";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Form validation schemas with better email validation
const loginSchema = z.object({
  email: z.string()
    .email("Please enter a valid email address")
    .refine((email) => validator.isEmail(email), {
      message: "Please enter a valid email address"
    }),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const registerSchema = z.object({
  email: z.string()
    .email("Please enter a valid email address")
    .refine((email) => validator.isEmail(email), {
      message: "Please enter a valid email address"
    }),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
  displayName: z.string().min(2, "Display name must be at least 2 characters"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { signIn, signInWithGoogle, user } = useAuth();

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
      email: "",
      password: "",
      confirmPassword: "",
      displayName: "",
    },
  });

  const resetForm = useCallback(() => {
    loginForm.reset();
    registerForm.reset();
    setAuthError("");
    setSuccessMessage("");
    setShowSuccess(false);
  }, [loginForm, registerForm]);

  // Auto-close modal when user is authenticated
  useEffect(() => {
    if (user && isOpen) {
      setTimeout(() => {
        onClose();
        resetForm();
      }, 1000);
    }
  }, [user, isOpen, onClose, resetForm]);

  const handleSubmit = async (data: LoginFormData | RegisterFormData) => {
    setIsLoading(true);
    setAuthError("");

    try {
      if (isSignUp) {
        // For registration, create the user directly and send Firebase email verification
        const registerData = data as RegisterFormData;
        const { createUserWithEmailAndPassword, updateProfile, sendEmailVerification } = await import("firebase/auth");
        const { auth } = await import("@/lib/firebase");
        const { userService } = await import("@/lib/user-service");

        console.log('Creating Firebase user account...');
        const userCredential = await createUserWithEmailAndPassword(auth, registerData.email, registerData.password);
        console.log('Firebase user created:', userCredential.user.uid);

        // Update display name
        console.log('Updating user profile...');
        await updateProfile(userCredential.user, {
          displayName: registerData.displayName
        });

        // Send Firebase email verification
        console.log('Sending Firebase email verification...');
        await sendEmailVerification(userCredential.user);

        // Create user profile in database
        console.log('Creating user profile in database...');
        try {
          await userService.createUserProfile(userCredential.user);
          console.log('User profile created successfully');
        } catch (profileError) {
          console.error('Error creating user profile:', profileError);
        }

        // Sign out the user until they verify their email
        console.log('Signing out user until email verification...');
        await auth.signOut();

        setSuccessMessage("Account created! Please check your email and verify your account before signing in.");
        setShowSuccess(true);

        // Switch to login tab after successful registration
        setTimeout(() => {
          setIsSignUp(false);
          setShowSuccess(false);
          setAuthError("");
          resetForm();
        }, 2000);
      } else {
        // For login, use the existing signIn function
        const loginData = data as LoginFormData;
        console.log('Attempting to sign in with:', loginData.email);
        await signIn(loginData.email, loginData.password);
        console.log('Sign in completed successfully');
        // Modal will be closed automatically by useEffect when user is authenticated
      }
    } catch (error: unknown) {
      console.error("Auth error:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorCode = (error as { code?: string }).code;
      
      if (errorCode === 'auth/email-already-in-use') {
        setAuthError("An account with this email already exists");
      } else if (errorCode === 'auth/weak-password') {
        setAuthError("Password should be at least 6 characters long");
      } else if (errorCode === 'auth/invalid-email') {
        setAuthError("Please enter a valid email address");
      } else if (errorCode === 'auth/operation-not-allowed') {
        setAuthError("Email/password accounts are not enabled. Please contact support.");
      } else if (errorCode === 'auth/user-not-found' || errorCode === 'auth/wrong-password') {
        setAuthError("Incorrect email or password");
      } else if (errorMessage.includes('permission-denied')) {
        setAuthError("Permission denied. Please try again or contact support.");
      } else {
        setAuthError(errorMessage || "Authentication failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setAuthError("");

    try {
      console.log('AuthModal: Starting Google sign-in...');
      await signInWithGoogle();
      console.log('AuthModal: Google sign-in completed successfully');
    } catch (error: unknown) {
      console.error("AuthModal: Google sign in error:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // More specific error messages for Google sign-in
      if (errorMessage.includes('popup-closed-by-user')) {
        setAuthError("Sign-in was cancelled. Please try again.");
      } else if (errorMessage.includes('popup-blocked')) {
        setAuthError("Pop-up was blocked. Please allow pop-ups for this site and try again.");
      } else if (errorMessage.includes('account-exists-with-different-credential')) {
        setAuthError("An account already exists with this email. Please use a different sign-in method.");
      } else if (errorMessage.includes('operation-not-allowed')) {
        setAuthError("Google sign-in is not enabled. Please contact support.");
      } else if (errorMessage.includes('network-request-failed')) {
        setAuthError("Network error. Please check your internet connection and try again.");
      } else if (errorMessage.includes('too-many-requests')) {
        setAuthError("Too many failed attempts. Please try again later.");
      } else {
        setAuthError(errorMessage || "Google sign in failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl">Welcome to Zero Budgeting</DialogTitle>
          <DialogDescription className="text-sm sm:text-base">
            Sign in to access your personalized budgeting tools and financial insights
          </DialogDescription>
        </DialogHeader>

        {showSuccess && (
          <Alert className="border-green-200 bg-green-50 text-green-800">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription>{successMessage}</AlertDescription>
          </Alert>
        )}

        {authError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{authError}</AlertDescription>
          </Alert>
        )}

        {/* Login/Signup Forms */}
        <Tabs value={isSignUp ? "signup" : "login"} onValueChange={(value) => setIsSignUp(value === "signup")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="space-y-4">
            <form onSubmit={loginForm.handleSubmit(handleSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    {...loginForm.register("email")}
                    type="email"
                    placeholder="Enter your email"
                    className="pl-10 h-10 sm:h-11"
                  />
                </div>
                {loginForm.formState.errors.email && (
                  <p className="text-xs sm:text-sm text-red-500">
                    {loginForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="login-password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    {...loginForm.register("password")}
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    className="pl-10 pr-10 h-10 sm:h-11"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {loginForm.formState.errors.password && (
                  <p className="text-xs sm:text-sm text-red-500">
                    {loginForm.formState.errors.password.message}
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full h-10 sm:h-11" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Signing In...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>

            <Button 
              variant="outline" 
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full h-10 sm:h-11"
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Continue with Google
            </Button>
          </TabsContent>

          <TabsContent value="signup" className="space-y-4">
            <form onSubmit={registerForm.handleSubmit(handleSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="register-name">Display Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    {...registerForm.register("displayName")}
                    type="text"
                    placeholder="Enter your name"
                    className="pl-10 h-10 sm:h-11"
                  />
                </div>
                {registerForm.formState.errors.displayName && (
                  <p className="text-xs sm:text-sm text-red-500">
                    {registerForm.formState.errors.displayName.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    {...registerForm.register("email")}
                    type="email"
                    placeholder="Enter your email"
                    className="pl-10 h-10 sm:h-11"
                  />
                </div>
                {registerForm.formState.errors.email && (
                  <p className="text-xs sm:text-sm text-red-500">
                    {registerForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    {...registerForm.register("password")}
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password"
                    className="pl-10 pr-10 h-10 sm:h-11"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {registerForm.formState.errors.password && (
                  <p className="text-xs sm:text-sm text-red-500">
                    {registerForm.formState.errors.password.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-confirm-password">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    {...registerForm.register("confirmPassword")}
                    type={showPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    className="pl-10 h-10 sm:h-11"
                  />
                </div>
                {registerForm.formState.errors.confirmPassword && (
                  <p className="text-xs sm:text-sm text-red-500">
                    {registerForm.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full h-10 sm:h-11" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Creating Account...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>

            <Button 
              variant="outline" 
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full h-10 sm:h-11"
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Continue with Google
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
} 