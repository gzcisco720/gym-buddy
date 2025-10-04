"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const AuthGuard = ({ children, fallback }: AuthGuardProps) => {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    console.log("🔍 AuthGuard check:", {
      status,
      hasSession: !!session,
      isActive: session?.user?.isActive,
      needsRegistration: session?.user?.needsRegistration,
    });

    // If session is loading, do nothing
    if (status === "loading") return;

    // If no session, redirect to login
    if (status === "unauthenticated") {
      router.push("/auth/login");
      return;
    }

    // If session exists but user is EXPLICITLY inactive (strict check), redirect to inactive page
    if (session?.user && session.user.isActive === false) {
      console.log("❌ User is inactive, redirecting to /auth/inactive");
      router.push("/auth/inactive");
      return;
    }
  }, [session, status, router]);

  // Show loading while checking authentication
  if (status === "loading") {
    return (
      fallback || (
        <div className="flex items-center justify-center min-h-screen bg-background">
          <div className="flex items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        </div>
      )
    );
  }

  // If not authenticated, don't render children
  if (status === "unauthenticated") {
    return null;
  }

  // If user is EXPLICITLY inactive (strict check), don't render children
  if (session?.user && session.user.isActive === false) {
    return null;
  }

  // If authenticated and active, render children
  return <>{children}</>;
};

export default AuthGuard;