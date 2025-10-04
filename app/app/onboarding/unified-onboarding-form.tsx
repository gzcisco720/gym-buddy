"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { Loader2, ChevronLeft, ChevronRight, Check, User, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

// Form validation schema
const unifiedOnboardingSchema = z.object({
  // Step 1: User Type & Basic Info
  userType: z.enum(["member", "trainer"], {
    required_error: "Please select a user type",
  }),
  phone: z.string().regex(/^(?:\+?61|0)(?:[2-478]\d{8}|4\d{8})$/, {
    message: "Please enter a valid Australian phone number (e.g., 0412345678 or +61412345678)",
  }),
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: "You must accept the terms and conditions",
  }),

  // Step 2: Static Info (Member only - conditional)
  gender: z.enum(["male", "female"]).optional(),
  dateOfBirth: z.string().optional(),
  height: z.coerce.number().min(120).max(250).optional(),

  // Step 3: Training Info (Member only - conditional)
  trainingLevel: z.enum(["beginner", "intermediate", "advanced", "elite"]).optional(),
  activityLevel: z
    .enum(["sedentary", "lightlyActive", "moderatelyActive", "veryActive", "extraActive"])
    .optional(),
  trainingYears: z.coerce.number().min(0).max(50).optional(),

  // Step 4: Body Composition (Member only - conditional)
  weight: z.coerce.number().min(30).max(300).optional(),
  bodyFatPercentage: z.coerce
    .number()
    .min(5)
    .max(50)
    .optional()
    .or(z.literal("")),
});

type UnifiedOnboardingFormValues = z.infer<typeof unifiedOnboardingSchema>;

export default function UnifiedOnboardingForm() {
  const router = useRouter();
  const { update } = useSession();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<UnifiedOnboardingFormValues>({
    resolver: zodResolver(unifiedOnboardingSchema),
    defaultValues: {
      userType: "member",
      phone: "",
      acceptTerms: false,
      gender: undefined,
      dateOfBirth: "",
      height: "" as any,
      trainingLevel: undefined,
      activityLevel: undefined,
      trainingYears: "" as any,
      weight: "" as any,
      bodyFatPercentage: "",
    },
  });

  const watchedUserType = form.watch("userType");

  // Dynamic steps based on user type
  const getSteps = () => {
    const baseStep = { id: 1, name: "Account Type", description: "Choose your role & basic info" };

    if (watchedUserType === "member") {
      return [
        baseStep,
        { id: 2, name: "Basic Info", description: "Gender, birthday & height" },
        { id: 3, name: "Training Info", description: "Your fitness level" },
        { id: 4, name: "Body Stats", description: "Weight & composition" },
      ];
    }

    // Trainer only has basic account setup
    return [baseStep];
  };

  const STEPS = getSteps();
  const totalSteps = STEPS.length;

  const onSubmit = async (data: UnifiedOnboardingFormValues) => {
    setIsSubmitting(true);

    try {
      // Validate member fields if user is a member
      if (data.userType === "member") {
        if (!data.gender || !data.dateOfBirth || !data.height || 
            !data.trainingLevel || !data.activityLevel || 
            data.trainingYears === undefined || !data.weight) {
          toast.error("Please complete all required fields");
          setIsSubmitting(false);
          return;
        }
      }

      const payload: any = {
        userType: data.userType,
        phone: data.phone,
      };

      // Add member-specific data if user is a member
      if (data.userType === "member") {
        const currentYear = new Date().getFullYear();
        const firstTrainingYear = currentYear - (data.trainingYears || 0);

        let leanBodyMass: number | undefined;
        if (data.bodyFatPercentage && data.weight) {
          const bodyFatPercentage = Number(data.bodyFatPercentage);
          const fatMass = data.weight * (bodyFatPercentage / 100);
          leanBodyMass = data.weight - fatMass;
        }

        payload.staticProfile = {
          gender: data.gender,
          dateOfBirth: data.dateOfBirth,
          height: data.height,
          trainingLevel: data.trainingLevel,
          activityLevel: data.activityLevel,
          firstTrainingYear,
        };

        payload.bodyComposition = {
          weight: data.weight,
          bodyFatPercentage: data.bodyFatPercentage ? Number(data.bodyFatPercentage) : undefined,
          leanBodyMass,
        };
      }

      const response = await fetch("/api/user/onboarding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to complete onboarding");
      }

      // Update session to reflect onboarding completion
      await update();

      toast.success("Welcome to Gym Buddy! 🎉", {
        description: "Redirecting to your dashboard...",
      });

      // Use replace to prevent going back to onboarding page
      router.replace("/overview");
    } catch (error: any) {
      console.error("Error completing onboarding:", error);
      toast.error("Failed to complete setup", {
        description: error.message || "Please try again",
      });
      setIsSubmitting(false);
    }
  };

  const validateStep = async () => {
    let fieldsToValidate: (keyof UnifiedOnboardingFormValues)[] = [];

    switch (currentStep) {
      case 1:
        fieldsToValidate = ["userType", "phone", "acceptTerms"];
        break;
      case 2:
        if (watchedUserType === "member") {
          fieldsToValidate = ["gender", "dateOfBirth", "height"];
        }
        break;
      case 3:
        if (watchedUserType === "member") {
          fieldsToValidate = ["trainingLevel", "activityLevel", "trainingYears"];
        }
        break;
      case 4:
        if (watchedUserType === "member") {
          fieldsToValidate = ["weight"];
        }
        break;
    }

    const result = await form.trigger(fieldsToValidate);
    return result;
  };

  const handleNext = async () => {
    const isValid = await validateStep();
    if (isValid && currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleUserTypeChange = (value: "member" | "trainer") => {
    form.setValue("userType", value);
    // Reset to step 1 when user type changes to avoid confusion
    if (currentStep > 1) {
      setCurrentStep(1);
    }
  };

  return (
    <div>
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors",
                    currentStep > step.id
                      ? "bg-primary text-primary-foreground"
                      : currentStep === step.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {currentStep > step.id ? <Check className="w-5 h-5" /> : step.id}
                </div>
                <div className="text-center mt-2">
                  <p className="text-sm font-medium">{step.name}</p>
                  <p className="text-xs text-muted-foreground">{step.description}</p>
                </div>
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-1 mx-2 transition-colors",
                    currentStep > step.id ? "bg-primary" : "bg-muted"
                  )}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Step 1: User Type & Basic Info */}
          {currentStep === 1 && (
            <div className="space-y-6">
              {/* User Type Selection */}
              <FormField
                control={form.control}
                name="userType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-medium">I want to join as:</FormLabel>
                    <RadioGroup
                      value={field.value}
                      onValueChange={handleUserTypeChange}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2 border border-default-300 rounded-lg p-4 flex-1 cursor-pointer hover:bg-default-50">
                        <RadioGroupItem value="member" id="member" />
                        <div className="flex items-center gap-2">
                          <User className="w-5 h-5 text-primary" />
                          <div>
                            <Label htmlFor="member" className="cursor-pointer font-medium">
                              Member
                            </Label>
                            <p className="text-sm text-default-600">I want to get fit</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 border border-default-300 rounded-lg p-4 flex-1 cursor-pointer hover:bg-default-50">
                        <RadioGroupItem value="trainer" id="trainer" />
                        <div className="flex items-center gap-2">
                          <UserCheck className="w-5 h-5 text-primary" />
                          <div>
                            <Label htmlFor="trainer" className="cursor-pointer font-medium">
                              Trainer
                            </Label>
                            <p className="text-sm text-default-600">I want to help others</p>
                          </div>
                        </div>
                      </div>
                    </RadioGroup>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Phone Number */}
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number *</FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
                        placeholder="0412345678 or +61412345678"
                        disabled={isSubmitting}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      We&apos;ll use this to contact you if needed
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Terms & Conditions */}
              <FormField
                control={form.control}
                name="acceptTerms"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-sm font-medium cursor-pointer">
                        I accept the Terms & Conditions and Privacy Policy
                      </FormLabel>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />

              {watchedUserType === "trainer" && (
                <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    🎯 As a trainer, you&apos;ll get access to client management tools, workout
                    planning features, and analytics. Click Next to complete your setup!
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Static Info (Member Only) */}
          {currentStep === 2 && watchedUserType === "member" && (
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg mb-4">
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  ℹ️ This information is used for accurate fitness calculations and won&apos;t
                  change frequently.
                </p>
              </div>

              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gender *</FormLabel>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex space-x-4"
                    >
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="male" />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer">Male</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="female" />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer">Female</FormLabel>
                      </FormItem>
                    </RadioGroup>
                    <FormDescription>Used for accurate metabolic rate calculations</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dateOfBirth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date of Birth *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormDescription>Your age will be automatically calculated</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="height"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Height (cm) *</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" placeholder="175" {...field} />
                    </FormControl>
                    <FormDescription>Your height in centimeters</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}

          {/* Step 3: Training Info (Member Only) */}
          {currentStep === 3 && watchedUserType === "member" && (
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="trainingLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Training Level *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your training level" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner - Less than 6 months</SelectItem>
                        <SelectItem value="intermediate">
                          Intermediate - 6 months to 2 years
                        </SelectItem>
                        <SelectItem value="advanced">Advanced - 2 to 5 years</SelectItem>
                        <SelectItem value="elite">Elite - More than 5 years</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>Your strength training experience level</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="activityLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Activity Level *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your activity level" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="sedentary">Sedentary - Little or no exercise</SelectItem>
                        <SelectItem value="lightlyActive">
                          Lightly Active - Exercise 1-3 days/week
                        </SelectItem>
                        <SelectItem value="moderatelyActive">
                          Moderately Active - Exercise 3-5 days/week
                        </SelectItem>
                        <SelectItem value="veryActive">
                          Very Active - Exercise 6-7 days/week
                        </SelectItem>
                        <SelectItem value="extraActive">
                          Extra Active - Physical job or 2x daily training
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Your overall daily activity including work and exercise
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="trainingYears"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Years of Training *</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.5" placeholder="2" {...field} />
                    </FormControl>
                    <FormDescription>
                      How many years you&apos;ve been training consistently
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}

          {/* Step 4: Body Composition (Member Only) */}
          {currentStep === 4 && watchedUserType === "member" && (
            <div className="space-y-4">
              <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg mb-4">
                <p className="text-sm text-green-800 dark:text-green-300">
                  📊 This information will be tracked over time to monitor your progress.
                </p>
              </div>

              <FormField
                control={form.control}
                name="weight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Weight (kg) *</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" placeholder="70" {...field} />
                    </FormControl>
                    <FormDescription>Your current body weight</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bodyFatPercentage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Body Fat Percentage (%) - Optional</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" placeholder="15" {...field} />
                    </FormControl>
                    <FormDescription>
                      If known from BIA, DEXA, or skinfold measurement
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1 || isSubmitting}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>

            {currentStep < totalSteps ? (
              <Button type="button" onClick={handleNext} disabled={isSubmitting}>
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    Complete Setup
                    <Check className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}
