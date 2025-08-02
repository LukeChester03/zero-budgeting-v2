"use client";

import { useAuth } from "@/lib/auth-context";
import { useFirebaseStore } from "@/lib/store-firebase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { User, Mail, Shield, Calendar, Database } from "lucide-react";

export default function AuthTestPage() {
  const { user, isLoading, error } = useAuth();
  const { budgets, debts, goals } = useFirebaseStore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-6 py-24">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl font-bold text-primary">
            Authentication Test
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mt-4">
            Verify Firebase authentication and data synchronization
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-6">
          {/* Authentication Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Authentication Status
              </CardTitle>
              <CardDescription>
                Current authentication state and user information
              </CardDescription>
            </CardHeader>
            <CardContent>
              {user ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Name:</span>
                        <span>{user.displayName || "Not set"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Email:</span>
                        <span>{user.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Verified:</span>
                        <Badge variant={user.emailVerified ? "default" : "destructive"}>
                          {user.emailVerified ? "Yes" : "No"}
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">User ID:</span>
                        <span className="font-mono text-sm">{user.uid}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Provider:</span>
                        <span>{user.providerData[0]?.providerId || "Email/Password"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Created:</span>
                        <span>{user.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : "Unknown"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <Alert>
                  <AlertDescription>
                    No user is currently authenticated. Please sign in to test the application.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Data Synchronization */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Data Synchronization
              </CardTitle>
              <CardDescription>
                Real-time data from Firebase Firestore
              </CardDescription>
            </CardHeader>
            <CardContent>
              {user ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-primary">{budgets.length}</div>
                    <div className="text-sm text-muted-foreground">Budgets</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-primary">{debts.length}</div>
                    <div className="text-sm text-muted-foreground">Debts</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-primary">{goals.length}</div>
                    <div className="text-sm text-muted-foreground">Goals</div>
                  </div>
                </div>
              ) : (
                <Alert>
                  <AlertDescription>
                    Sign in to see your synchronized data.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Error Display */}
          {error && (
            <Card>
              <CardHeader>
                <CardTitle className="text-destructive">Authentication Error</CardTitle>
              </CardHeader>
              <CardContent>
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          )}

          {/* Test Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Test Actions</CardTitle>
              <CardDescription>
                Test authentication functionality
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button variant="outline" className="w-full">
                    Test Profile Page
                  </Button>
                  <Button variant="outline" className="w-full">
                    Test Protected Route
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  These buttons can be used to test various authentication features.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 