"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
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
  // Step 1: Basic Info (Required)
  weight: z.coerce
    .number()
    .min(30, "Weight must be at least 30 kg")
    .max(300, "Weight must not exceed 300 kg"),
  height: z.coerce
    .number()
    .min(120, "Height must be at least 120 cm")
    .max(250, "Height must not exceed 250 cm"),
  age: z.coerce
    .number()
    .min(10, "Age must be at least 10 years")
    .max(100, "Age must not exceed 100 years"),
  gender: z.enum(["male", "female"], {
    required_error: "Please select your gender",
  }),

  // Step 2: Training Info (Required)
  trainingLevel: z.enum(["beginner", "intermediate", "advanced", "elite"], {
    required_error: "Please select your training level",
  }),
  activityLevel: z.enum(
    ["sedentary", "lightlyActive", "moderatelyActive", "veryActive", "extraActive"],
    {
      required_error: "Please select your activity level",
    }
  ),

  // Step 3: Optional Info
  bodyFatPercentage: z.coerce
    .number()
    .min(5, "Body fat percentage must be at least 5%")
    .max(50, "Body fat percentage must not exceed 50%")
    .optional()
    .or(z.literal("")),
  trainingYears: z.coerce
    .number()
    .min(0, "Training years must be at least 0")
    .max(50, "Training years must not exceed 50")
    .optional()
    .or(z.literal("")),
});

type FitnessProfileFormValues = z.infer<typeof fitnessProfileSchema>;

const STEPS = [
  { id: 1, name: "Basic Info", description: "Body measurements" },
  { id: 2, name: "Training Info", description: "Your fitness level" },
  { id: 3, name: "Optional Info", description: "Additional details" },
];

export default function FitnessProfileForm() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FitnessProfileFormValues>({
    resolver: zodResolver(fitnessProfileSchema),
    defaultValues: {
      weight: undefined,
      height: undefined,
      age: undefined,
      gender: undefined,
      trainingLevel: undefined,
      activityLevel: undefined,
      bodyFatPercentage: "",
      trainingYears: "",
    },
  });

  const onSubmit = async (data: FitnessProfileFormValues) => {
    setIsSubmitting(true);

    try {
      // Calculate lean body mass if body fat percentage is provided
      let leanBodyMass: number | undefined;
      if (data.bodyFatPercentage && data.weight) {
        const bodyFatPercentage = Number(data.bodyFatPercentage);
        const fatMass = data.weight * (bodyFatPercentage / 100);
        leanBodyMass = data.weight - fatMass;
      }

      const payload = {
        fitnessProfile: {
          weight: data.weight,
          height: data.height,
          age: data.age,
          trainingLevel: data.trainingLevel,
          activityLevel: data.activityLevel,
          bodyFatPercentage: data.bodyFatPercentage ? Number(data.bodyFatPercentage) : undefined,
          leanBodyMass,
          trainingYears: data.trainingYears ? Number(data.trainingYears) : undefined,
          profileCompletedAt: new Date(),
        },
        gender: data.gender,
      };

      const response = await fetch("/api/user/fitness-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to save fitness profile");
      }

      toast.success("Fitness profile completed! 🎉", {
        description: "Redirecting to your dashboard...",
      });

      // Small delay for better UX
      setTimeout(() => {
        router.push("/overview");
        router.refresh();
      }, 1000);
    } catch (error: any) {
      console.error("Error saving fitness profile:", error);
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
        fieldsToValidate = ["weight", "height", "age", "gender"];
        break;
      case 2:
        fieldsToValidate = ["trainingLevel", "activityLevel"];
        break;
      case 3:
        // Optional step, no required validation
        return true;
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
          {/* Step 1: Basic Info */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="weight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Weight (kg) *</FormLabel>
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
                      <FormDescription>Your height in centimeters</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="age"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Age *</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="25" {...field} />
                      </FormControl>
                      <FormDescription>Your current age</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gender *</FormLabel>
                      <FormControl>
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
                      </FormControl>
                      <FormDescription>
                        Used for accurate metabolic calculations
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
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
            </div>
          )}

          {/* Step 3: Optional Info */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="bg-muted/50 p-4 rounded-lg mb-4">
                <p className="text-sm text-muted-foreground">
                  These fields are optional but help us provide more accurate
                  recommendations. You can skip this step and add them later.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                <FormField
                  control={form.control}
                  name="trainingYears"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Years of Training - Optional</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.5"
                          placeholder="2"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        How long you&apos;ve been training consistently
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
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
