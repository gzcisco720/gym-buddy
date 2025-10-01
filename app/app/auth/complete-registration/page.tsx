import { Metadata } from "next";
import CompleteRegistrationForm from "./registration-form";

export const metadata: Metadata = {
  title: "Complete Registration | Gym Buddy",
  description: "Complete your registration to get started",
};

export default function CompleteRegistrationPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Complete Your Registration</h1>
          <p className="text-muted-foreground">
            Please provide additional information to complete your account setup
          </p>
        </div>
        <CompleteRegistrationForm />
      </div>
    </div>
  );
}
