"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, sendEmailVerification } from "firebase/auth";
import { auth } from "./firebase";
import { useFirebaseStore } from "./store-firebase";
import { userService } from "./user-service";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { setUser: setStoreUser } = useFirebaseStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed:', user ? 'User logged in' : 'User logged out');
      console.log('User details:', user ? { uid: user.uid, email: user.email, emailVerified: user.emailVerified } : 'No user');
      
      if (user) {
        // Check if user is email verified
        if (!user.emailVerified) {
          console.log('User email not verified, signing out');
          await auth.signOut();
          setError("Please verify your email address before signing in.");
          setIsLoading(false);
          return;
        }

        // User is verified, proceed with normal flow
        console.log('Setting user state in auth context');
        setUser(user); // Set the local user state
        await setStoreUser(user);
        setIsLoading(false);

        try {
          await userService.updateLastLogin(user.uid);
        } catch (error) {
          console.error('Error updating last login:', error);
        }
      } else {
        console.log('User logged out, cleaning up');
        setUser(null); // Clear the local user state
        await setStoreUser(null);
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [setStoreUser]);

  const signIn = async (email: string, password: string) => {
    try {
      console.log('AuthContext: Starting sign in for:', email);
      setError(null);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('AuthContext: Firebase sign in successful for:', userCredential.user.uid);
      
      // Check if email is verified
      if (!userCredential.user.emailVerified) {
        console.log('AuthContext: User email not verified, signing out');
        await auth.signOut();
        throw new Error("Please verify your email address before signing in. Check your inbox for a verification link.");
      }

      console.log('AuthContext: User email verified, proceeding with profile check');

      // Ensure user profile exists in database (like Google sign-in)
      try {
        const existingProfile = await userService.getUserProfile(userCredential.user.uid);
        if (!existingProfile) {
          console.log('AuthContext: No user profile found for email sign-in, creating one...');
          await userService.createUserProfile(userCredential.user);
          console.log('AuthContext: User profile created for email sign-in');
        } else {
          console.log('AuthContext: Existing profile found for email sign-in');
        }
      } catch (error) {
        console.error('AuthContext: Error checking/creating user profile for email sign-in:', error);
        // Don't throw error for profile creation as user is already signed in
      }

      console.log('AuthContext: Sign in process completed successfully');
    } catch (error: any) {
      console.error("AuthContext: Sign in error:", error);
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        throw new Error("Incorrect email or password");
      } else if (error.code === 'auth/user-disabled') {
        throw new Error("This account has been disabled");
      } else if (error.code === 'auth/too-many-requests') {
        throw new Error("Too many failed attempts. Please try again later");
      } else {
        throw new Error(error.message || "Sign in failed");
      }
    }
  };

  const signUp = async (email: string, password: string, displayName: string) => {
    try {
      setError(null);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update display name
      await updateProfile(userCredential.user, {
        displayName: displayName
      });

      // Send email verification
      await sendEmailVerification(userCredential.user);

      // Create user profile in database (user is now authenticated)
      await userService.createUserProfile(userCredential.user);
      
      // Sign out the user until they verify their email
      await auth.signOut();
      
      throw new Error("Account created! Please check your email and verify your account before signing in.");
    } catch (error: any) {
      console.error("Sign up error:", error);
      if (error.code === 'auth/email-already-in-use') {
        throw new Error("An account with this email already exists");
      } else if (error.code === 'auth/weak-password') {
        throw new Error("Password should be at least 6 characters long");
      } else if (error.code === 'auth/invalid-email') {
        throw new Error("Please enter a valid email address");
      } else if (error.code === 'auth/operation-not-allowed') {
        throw new Error("Email/password accounts are not enabled. Please contact support.");
      } else {
        throw new Error(error.message || "Sign up failed");
      }
    }
  };

  const signInWithGoogle = async () => {
    try {
      setError(null);
      const { GoogleAuthProvider, signInWithPopup } = await import("firebase/auth");
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      
      console.log('Google sign-in successful for:', userCredential.user.uid);
      
      // For Google sign-in, we need to check if user profile exists
      try {
        const existingProfile = await userService.getUserProfile(userCredential.user.uid);
        if (!existingProfile) {
          console.log('No existing profile found, creating new profile...');
          // User profile doesn't exist, create it
          await userService.createUserProfile(userCredential.user);
          console.log('User profile created for Google sign-in');
        } else {
          console.log('Existing profile found for Google sign-in');
        }
      } catch (error) {
        console.error('Error checking/creating user profile for Google sign-in:', error);
        // Don't throw error for profile creation as user is already signed in
      }
    } catch (error: any) {
      console.error("Google sign in error:", error);
      if (error.code === 'auth/popup-closed-by-user') {
        throw new Error("Sign-in was cancelled");
      } else if (error.code === 'auth/popup-blocked') {
        throw new Error("Pop-up was blocked. Please allow pop-ups for this site");
      } else {
        throw new Error(error.message || "Google sign-in failed");
      }
    }
  };

  const signOut = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  const clearError = () => {
    setError(null);
  };

  const value = {
    user,
    isLoading,
    error,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
} 