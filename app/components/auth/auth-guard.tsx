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
    // If session is loading, do nothing
    if (status === "loading") return;

    // If no session, redirect to login
    if (status === "unauthenticated") {
      router.push("/auth/login");
      return;
    }

    // If session exists but user is inactive, redirect to inactive page
    if (session?.user && !session.user.isActive) {
      router.push("/auth/inactive");
      return;
    }

    // If session exists but user hasn't completed onboarding, redirect to onboarding
    if (session?.user && !session.user.onboardingCompleted) {
      router.push("/onboarding");
      return;
    }
  }, [session, status, router]);

  // Show loading while checking authentication
  if (status === "loading") {
    return (
      fallback || (
        <div className="flex items-center justify-center min-h-screen">
          <div className="flex flex-col items-center space-y-4">
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

  // If user is inactive, don't render children
  if (session?.user && !session.user.isActive) {
    return null;
  }

  // If user hasn't completed onboarding, don't render children
  if (session?.user && !session.user.onboardingCompleted) {
    return null;
  }

  // If authenticated, active, and onboarded, render children
  return <>{children}</>;
};

export default AuthGuard;