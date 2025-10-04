"use client";

import { useSession } from "next-auth/react";
import UnifiedOnboardingForm from "./unified-onboarding-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SiteLogo } from "@/components/svg";

export default function OnboardingPage() {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <SiteLogo className="h-16 w-16 text-primary" />
          </div>
          <h1 className="text-4xl font-bold mb-2">Welcome to Gym Buddy! 👋</h1>
          <p className="text-muted-foreground text-lg">
            {session?.user?.name && `Hi ${session.user.name}! `}
            Let&apos;s complete your account setup
          </p>
        </div>

        <Card className="shadow-2xl">
          <CardHeader>
            <CardTitle>Complete Your Profile</CardTitle>
            <CardDescription>
              Tell us a bit about yourself. This will help us personalize your experience.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UnifiedOnboardingForm />
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Don&apos;t worry, you can update this information anytime from your profile settings.
        </p>
      </div>
    </div>
  );
}
