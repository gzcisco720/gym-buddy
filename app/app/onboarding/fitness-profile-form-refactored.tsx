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
import { Loader2, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";

// Form validation schema
const fitnessProfileSchema = z.object({
  // Step 1: Static Info (Immutable - Required)
  gender: z.enum(["male", "female"], {
    required_error: "Please select your gender",
  }),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  height: z.coerce
    .number()
    .min(120, "Height must be at least 120 cm")
    .max(250, "Height must not exceed 250 cm"),

  // Step 2: Training Info (Slowly changing - Required)
  trainingLevel: z.enum(["beginner", "intermediate", "advanced", "elite"], {
    required_error: "Please select your training level",
  }),
  activityLevel: z.enum(
    ["sedentary", "lightlyActive", "moderatelyActive", "veryActive", "extraActive"],
    {
      required_error: "Please select your activity level",
    }
  ),
  trainingYears: z.coerce
    .number()
    .min(0, "Training years must be at least 0")
    .max(50, "Training years must not exceed 50"),

  // Step 3: Body Composition (Variable - Required for weight, optional for body fat)
  weight: z.coerce
    .number()
    .min(30, "Weight must be at least 30 kg")
    .max(300, "Weight must not exceed 300 kg"),
  bodyFatPercentage: z.coerce
    .number()
    .min(5, "Body fat percentage must be at least 5%")
    .max(50, "Body fat percentage must not exceed 50%")
    .optional()
    .or(z.literal("")),
});

type FitnessProfileFormValues = z.infer<typeof fitnessProfileSchema>;

const STEPS = [
  { id: 1, name: "Basic Info", description: "Gender, birthday & height" },
  { id: 2, name: "Training Info", description: "Your fitness level" },
  { id: 3, name: "Body Stats", description: "Weight & composition" },
];

export default function FitnessProfileFormRefactored() {
  const router = useRouter();
  const { update } = useSession();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FitnessProfileFormValues>({
    resolver: zodResolver(fitnessProfileSchema),
    defaultValues: {
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

  const onSubmit = async (data: FitnessProfileFormValues) => {
    setIsSubmitting(true);

    try {
      // Calculate firstTrainingYear from trainingYears
      const currentYear = new Date().getFullYear();
      const firstTrainingYear = currentYear - data.trainingYears;

      // Calculate lean body mass if body fat percentage is provided
      let leanBodyMass: number | undefined;
      if (data.bodyFatPercentage && data.weight) {
        const bodyFatPercentage = Number(data.bodyFatPercentage);
        const fatMass = data.weight * (bodyFatPercentage / 100);
        leanBodyMass = data.weight - fatMass;
      }

      const payload = {
        staticProfile: {
          gender: data.gender,
          dateOfBirth: data.dateOfBirth,
          height: data.height,
          trainingLevel: data.trainingLevel,
          activityLevel: data.activityLevel,
          firstTrainingYear,
        },
        bodyComposition: {
          weight: data.weight,
          bodyFatPercentage: data.bodyFatPercentage ? Number(data.bodyFatPercentage) : undefined,
          leanBodyMass,
        },
      };

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

      // Update session to refresh JWT token with new onboardingCompleted status
      await update();

      toast.success("Profile completed! 🎉", {
        description: "Redirecting to your dashboard...",
      });

      // Redirect immediately for better performance
      router.push("/overview");
    } catch (error: any) {
      console.error("Error completing onboarding:", error);
      toast.error("Failed to save profile", {
        description: error.message || "Please try again",
      });
      setIsSubmitting(false);
    }
  };

  const validateStep = async () => {
    let fieldsToValidate: (keyof FitnessProfileFormValues)[] = [];

    switch (currentStep) {
      case 1:
        fieldsToValidate = ["gender", "dateOfBirth", "height"];
        break;
      case 2:
        fieldsToValidate = ["trainingLevel", "activityLevel", "trainingYears"];
        break;
      case 3:
        fieldsToValidate = ["weight"];
        break;
    }

    const result = await form.trigger(fieldsToValidate);
    return result;
  };

  const handleNext = async () => {
    const isValid = await validateStep();
    if (isValid && currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
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
                  {currentStep > step.id ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    step.id
                  )}
                </div>
                <div className="text-center mt-2">
                  <p className="text-sm font-medium">{step.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {step.description}
                  </p>
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
          {/* Step 1: Static Info */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg mb-4">
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  ℹ️ This information is used for accurate fitness calculations and won&apos;t change frequently.
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
                        <FormLabel className="font-normal cursor-pointer">
                          Male
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="female" />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer">
                          Female
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                    <FormDescription>
                      Used for accurate metabolic rate calculations
                    </FormDescription>
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
                    <FormDescription>
                      Your age will be automatically calculated
                    </FormDescription>
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
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="175"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Your height in centimeters
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}

          {/* Step 2: Training Info */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="trainingLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Training Level *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your training level" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="beginner">
                          Beginner - Less than 6 months
                        </SelectItem>
                        <SelectItem value="intermediate">
                          Intermediate - 6 months to 2 years
                        </SelectItem>
                        <SelectItem value="advanced">
                          Advanced - 2 to 5 years
                        </SelectItem>
                        <SelectItem value="elite">
                          Elite - More than 5 years
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Your strength training experience level
                    </FormDescription>
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
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your activity level" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="sedentary">
                          Sedentary - Little or no exercise
                        </SelectItem>
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
                      <Input
                        type="number"
                        step="0.5"
                        placeholder="2"
                        {...field}
                      />
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

          {/* Step 3: Body Composition */}
          {currentStep === 3 && (
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
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="70"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Your current body weight
                    </FormDescription>
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
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="15"
                        {...field}
                      />
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

            {currentStep < STEPS.length ? (
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
                    Complete Profile
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
