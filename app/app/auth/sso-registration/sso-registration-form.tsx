"use client";
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { Checkbox } from "@/components/ui/checkbox";
import { SiteLogo } from "@/components/svg";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useSession } from "next-auth/react";

const schema = z.object({
  // Basic Info
  phone: z.string()
    .regex(/^(?:\+?61|0)(?:[2-478]\d{8}|4\d{8})$/, {
      message: "Please enter a valid Australian phone number (e.g., 0412345678 or +61412345678)"
    }),
  gender: z.enum(["male", "female"], {
    required_error: "Please select your gender",
  }),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  
  // Fitness Info
  height: z.number().min(120, "Height must be at least 120 cm").max(250, "Height must not exceed 250 cm"),
  weight: z.number().min(30, "Weight must be at least 30 kg").max(300, "Weight must not exceed 300 kg"),
  trainingLevel: z.enum(["beginner", "intermediate", "advanced", "elite"], {
    required_error: "Please select your training level",
  }),
  activityLevel: z.enum(["sedentary", "lightlyActive", "moderatelyActive", "veryActive", "extraActive"], {
    required_error: "Please select your activity level",
  }),
  trainingYears: z.number().min(0, "Training years cannot be negative").max(100, "Training years cannot exceed 100"),
  
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: "You must accept the terms and conditions",
  }),
});

type FormData = z.infer<typeof schema>;

const SsoRegistrationForm = () => {
  const [isPending, startTransition] = React.useTransition();
  const isDesktop2xl = useMediaQuery("(max-width: 1530px)");
  const { data: session, update } = useSession();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: "all",
    defaultValues: {
      acceptTerms: false,
    }
  });

  const trainingLevel = watch("trainingLevel");
  const activityLevel = watch("activityLevel");

  React.useEffect(() => {
    if (session && !session.user?.needsRegistration) {
      router.push("/overview");
    }
  }, [session, router]);

  const onSubmit = (data: FormData) => {
    startTransition(async () => {
      try {
        const response = await fetch("/api/auth/sso-registration", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            phone: data.phone,
            gender: data.gender,
            dateOfBirth: data.dateOfBirth,
            height: data.height,
            weight: data.weight,
            trainingLevel: data.trainingLevel,
            activityLevel: data.activityLevel,
            trainingYears: data.trainingYears,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to complete registration");
        }

        await update();
        toast.success("Registration completed! Welcome to Gym Buddy! 💪");
        router.push("/overview");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to complete registration. Please try again.");
      }
    });
  };

  if (!session?.user) {
    return null;
  }

  return (
    <div className="w-full">
      <SiteLogo className="h-10 w-10 2xl:w-14 2xl:h-14 text-primary mb-6" />
      <div className="2xl:mt-8 mt-6 2xl:text-3xl text-2xl font-bold text-default-900">
        Complete Your Profile
      </div>
      <div className="2xl:text-lg text-base text-default-600 mt-2 leading-6">
        Welcome {session.user.name}! Let&apos;s set up your fitness profile.
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-5 xl:mt-7 space-y-6">
        {/* Account Info */}
        <div className="bg-primary/10 border border-primary/20 p-4 rounded-lg">
          <p className="text-sm text-default-700 dark:text-default-300">
            <span className="font-semibold">✓ Account Connected</span>
          </p>
          <p className="text-xs text-default-600 dark:text-default-400 mt-1">
            Email: {session.user.email}
          </p>
        </div>

        {/* Basic Information Section */}
        <div className="bg-card p-5 rounded-lg border">
          <h3 className="text-lg font-semibold text-default-900 mb-4">Basic Information</h3>
          
          <div className="space-y-4">
            {/* Phone Number */}
            <div>
              <Label htmlFor="phone" className="text-sm font-medium text-default-900 mb-2 block">
                Phone Number *
              </Label>
              <Input
                removeWrapper
                type="tel"
                id="phone"
                size={!isDesktop2xl ? "xl" : "lg"}
                placeholder="0412345678 or +61412345678"
                disabled={isPending}
                {...register("phone")}
                className={cn({
                  "border-destructive": errors.phone,
                })}
              />
              {errors.phone && (
                <div className="text-destructive text-sm mt-2">{errors.phone.message}</div>
              )}
            </div>

            {/* Gender and Date of Birth */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-default-900 mb-2 block">Gender *</Label>
                <RadioGroup
                  onValueChange={(value: string) => setValue("gender", value as "male" | "female")}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="male" id="male" />
                    <Label htmlFor="male" className="cursor-pointer font-normal">Male</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="female" id="female" />
                    <Label htmlFor="female" className="cursor-pointer font-normal">Female</Label>
                  </div>
                </RadioGroup>
                {errors.gender && (
                  <div className="text-destructive text-sm mt-2">{errors.gender.message}</div>
                )}
              </div>

              <div>
                <Label htmlFor="dateOfBirth" className="text-sm font-medium text-default-900 mb-2 block">
                  Date of Birth *
                </Label>
                <Input
                  removeWrapper
                  type="date"
                  id="dateOfBirth"
                  size={!isDesktop2xl ? "xl" : "lg"}
                  disabled={isPending}
                  max={new Date().toISOString().split('T')[0]}
                  {...register("dateOfBirth")}
                  className={cn({
                    "border-destructive": errors.dateOfBirth,
                  })}
                />
                {errors.dateOfBirth && (
                  <div className="text-destructive text-sm mt-2">{errors.dateOfBirth.message}</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Body Metrics Section */}
        <div className="bg-card p-5 rounded-lg border">
          <h3 className="text-lg font-semibold text-default-900 mb-4">Body Metrics</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="height" className="text-sm font-medium text-default-900 mb-2 block">
                Height (cm) *
              </Label>
              <Input
                removeWrapper
                type="number"
                id="height"
                placeholder="170"
                disabled={isPending}
                {...register("height", { valueAsNumber: true })}
                className={cn({
                  "border-destructive": errors.height,
                })}
              />
              {errors.height && (
                <div className="text-destructive text-sm mt-1">{errors.height.message}</div>
              )}
            </div>

            <div>
              <Label htmlFor="weight" className="text-sm font-medium text-default-900 mb-2 block">
                Weight (kg) *
              </Label>
              <Input
                removeWrapper
                type="number"
                id="weight"
                placeholder="70"
                disabled={isPending}
                {...register("weight", { valueAsNumber: true })}
                className={cn({
                  "border-destructive": errors.weight,
                })}
              />
              {errors.weight && (
                <div className="text-destructive text-sm mt-1">{errors.weight.message}</div>
              )}
            </div>
          </div>
        </div>

        {/* Training Information Section */}
        <div className="bg-card p-5 rounded-lg border">
          <h3 className="text-lg font-semibold text-default-900 mb-4">Training Information</h3>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="trainingLevel" className="text-sm font-medium text-default-900 mb-2 block">
                Training Level *
              </Label>
              <Select onValueChange={(value) => setValue("trainingLevel", value as any)} value={trainingLevel}>
                <SelectTrigger className={cn({ "border-destructive": errors.trainingLevel })}>
                  <SelectValue placeholder="Select your training level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner (0-1 years)</SelectItem>
                  <SelectItem value="intermediate">Intermediate (1-3 years)</SelectItem>
                  <SelectItem value="advanced">Advanced (3-5 years)</SelectItem>
                  <SelectItem value="elite">Elite (5+ years)</SelectItem>
                </SelectContent>
              </Select>
              {errors.trainingLevel && (
                <div className="text-destructive text-sm mt-1">{errors.trainingLevel.message}</div>
              )}
            </div>

            <div>
              <Label htmlFor="activityLevel" className="text-sm font-medium text-default-900 mb-2 block">
                Activity Level *
              </Label>
              <Select onValueChange={(value) => setValue("activityLevel", value as any)} value={activityLevel}>
                <SelectTrigger className={cn({ "border-destructive": errors.activityLevel })}>
                  <SelectValue placeholder="Select your activity level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sedentary">Sedentary (Little or no exercise)</SelectItem>
                  <SelectItem value="lightlyActive">Lightly Active (1-3 days/week)</SelectItem>
                  <SelectItem value="moderatelyActive">Moderately Active (3-5 days/week)</SelectItem>
                  <SelectItem value="veryActive">Very Active (6-7 days/week)</SelectItem>
                  <SelectItem value="extraActive">Extra Active (Athlete/Physical job)</SelectItem>
                </SelectContent>
              </Select>
              {errors.activityLevel && (
                <div className="text-destructive text-sm mt-1">{errors.activityLevel.message}</div>
              )}
            </div>

            <div>
              <Label htmlFor="trainingYears" className="text-sm font-medium text-default-900 mb-2 block">
                Years of Training Experience *
              </Label>
              <Input
                removeWrapper
                type="number"
                id="trainingYears"
                placeholder="2"
                disabled={isPending}
                {...register("trainingYears", { valueAsNumber: true })}
                className={cn({
                  "border-destructive": errors.trainingYears,
                })}
              />
              {errors.trainingYears && (
                <div className="text-destructive text-sm mt-1">{errors.trainingYears.message}</div>
              )}
              <p className="text-xs text-default-500 mt-1">
                How many years have you been training consistently?
              </p>
            </div>
          </div>
        </div>

        {/* Terms & Conditions */}
        <div className="flex items-center gap-3">
          <Checkbox
            id="terms"
            className="border-default-300"
            onCheckedChange={(checked: boolean) => setValue("acceptTerms", checked)}
          />
          <Label
            htmlFor="terms"
            className="text-base font-medium text-default-600 cursor-pointer"
          >
            You accept our Terms & Conditions and Privacy Policy
          </Label>
        </div>
        {errors.acceptTerms && (
          <div className="text-destructive text-sm">{errors.acceptTerms.message}</div>
        )}

        <Button
          className="w-full"
          disabled={isPending}
          size={!isDesktop2xl ? "lg" : "md"}
        >
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isPending ? "Creating Your Profile..." : "Complete Registration"}
        </Button>
      </form>
    </div>
  );
};

export default SsoRegistrationForm;
