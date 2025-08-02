import ProtectedRoute from "@/app/components/ProtectedRoute";
import UserProfile from "@/app/components/UserProfile";

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <div className="container mx-auto px-6 py-24">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-6xl font-bold text-primary">
              Profile
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mt-4">
              Manage your account settings and profile information
            </p>
          </div>
          <UserProfile />
        </div>
      </div>
    </ProtectedRoute>
  );
} 