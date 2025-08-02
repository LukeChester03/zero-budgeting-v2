"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, User, Mail, Shield, LogOut, Edit, Check, X } from "lucide-react";

export default function UserProfile() {
  const { user, logout, updateUserProfile, sendVerificationEmail, error, clearError } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const handleUpdateProfile = async () => {
    if (!user) return;
    
    setIsLoading(true);
    clearError();
    setSuccessMessage("");
    
    try {
      await updateUserProfile(displayName);
      setSuccessMessage("Profile updated successfully!");
      setIsEditing(false);
    } catch (error) {
      // Error is handled by auth context
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendVerification = async () => {
    setIsLoading(true);
    clearError();
    setSuccessMessage("");
    
    try {
      await sendVerificationEmail();
      setSuccessMessage("Verification email sent! Check your inbox.");
    } catch (error) {
      // Error is handled by auth context
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await logout();
    } catch (error) {
      // Error is handled by auth context
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            User Profile
          </CardTitle>
          <CardDescription>
            Manage your account settings and profile information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {successMessage && (
            <Alert>
              <AlertDescription>{successMessage}</AlertDescription>
            </Alert>
          )}

          {/* Profile Information */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Profile Information</h3>
              {!isEditing && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Enter your display name"
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button
                    onClick={handleUpdateProfile}
                    disabled={isLoading}
                    size="sm"
                  >
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Check className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false);
                      setDisplayName(user.displayName || "");
                    }}
                    size="sm"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Name:</span>
                  <span>{user.displayName || "Not set"}</span>
                </div>
                
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Email:</span>
                  <span>{user.email}</span>
                  {!user.emailVerified && (
                    <Badge variant="secondary">Unverified</Badge>
                  )}
                </div>
                
                <div className="flex items-center gap-3">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Email Verified:</span>
                  <Badge variant={user.emailVerified ? "default" : "destructive"}>
                    {user.emailVerified ? "Verified" : "Not Verified"}
                  </Badge>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Account Actions */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Account Actions</h3>
            
            <div className="space-y-3">
              {!user.emailVerified && (
                <Button
                  variant="outline"
                  onClick={handleSendVerification}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Mail className="h-4 w-4 mr-2" />
                  Send Verification Email
                </Button>
              )}
              
              <Button
                variant="destructive"
                onClick={handleLogout}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>

          <Separator />

          {/* Account Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Account Details</h3>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">User ID:</span>
                <span className="font-mono">{user.uid}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-muted-foreground">Provider:</span>
                <span>{user.providerData[0]?.providerId || "Email/Password"}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created:</span>
                <span>{user.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : "Unknown"}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Sign In:</span>
                <span>{user.metadata.lastSignInTime ? new Date(user.metadata.lastSignInTime).toLocaleDateString() : "Unknown"}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 