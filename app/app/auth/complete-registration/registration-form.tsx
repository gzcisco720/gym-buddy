"use client";
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, User, UserCheck } from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { Checkbox } from "@/components/ui/checkbox";
import { SiteLogo } from "@/components/svg";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useSession } from "next-auth/react";

const schema = z.object({
  userType: z.enum(["member", "trainer"], { message: "Please select a user type" }),
  phone: z.string()
    .regex(/^(?:\+?61|0)(?:[2-478]\d{8}|4\d{8})$/, {
      message: "Please enter a valid Australian phone number (e.g., 0412345678 or +61412345678)"
    }),
  dateOfBirth: z.string().min(1, { message: "Please select your date of birth." }),
  gender: z.enum(["male", "female", "other"], { message: "Please select your gender" }),
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: "You must accept the terms and conditions",
  }),
});

type FormData = z.infer<typeof schema>;

const CompleteRegistrationForm = () => {
  const [isPending, startTransition] = React.useTransition();
  const isDesktop2xl = useMediaQuery("(max-width: 1530px)");
  const router = useRouter();
  const { data: session, update } = useSession();

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
      userType: "member",
      acceptTerms: false,
    },
  });

  const watchedUserType = watch("userType");

  useEffect(() => {
    // If user is already fully registered, redirect to dashboard
    if (session?.user && !session.user.needsRegistration) {
      router.push("/overview");
    }
  }, [session, router]);

  const onSubmit = (data: FormData) => {
    startTransition(async () => {
      try {
        const response = await fetch("/api/auth/complete-registration", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...data,
            dateOfBirth: new Date(data.dateOfBirth),
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to complete registration");
        }

        toast.success("Registration completed successfully!");

        // Update session to reflect registration completion
        await update();

        // Redirect to dashboard
        router.push("/overview");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to complete registration. Please try again.");
      }
    });
  };

  const handleUserTypeChange = (value: "member" | "trainer") => {
    setValue("userType", value);
  };

  if (!session?.user) {
    return (
      <div className="text-center">
        <p className="text-muted-foreground">Please sign in to complete registration.</p>
      </div>
    );
  }

  return (
    <div className="w-full bg-card p-8 rounded-lg shadow-lg">
      <div className="text-center mb-6">
        <div className="flex justify-center mb-4">
          <SiteLogo className="h-12 w-12 text-primary" />
        </div>
        <p className="text-sm text-muted-foreground">
          Welcome, {session.user.name || session.user.email}! Please provide some additional information.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* User Type Selection */}
        <div>
          <Label className="text-base font-medium text-default-900 mb-3 block">
            I want to join as:
          </Label>
          <RadioGroup
            value={watchedUserType}
            onValueChange={handleUserTypeChange}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2 border border-default-300 rounded-lg p-4 flex-1 cursor-pointer hover:bg-default-50">
              <RadioGroupItem value="member" id="member" />
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                <div>
                  <Label htmlFor="member" className="cursor-pointer font-medium">Member</Label>
                  <p className="text-sm text-default-600">I want to get fit</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2 border border-default-300 rounded-lg p-4 flex-1 cursor-pointer hover:bg-default-50">
              <RadioGroupItem value="trainer" id="trainer" />
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-primary" />
                <div>
                  <Label htmlFor="trainer" className="cursor-pointer font-medium">Trainer</Label>
                  <p className="text-sm text-default-600">I want to help others</p>
                </div>
              </div>
            </div>
          </RadioGroup>
          {errors.userType && (
            <div className="text-destructive mt-2 text-sm">{errors.userType.message}</div>
          )}
        </div>

        {/* Basic Information */}
        <div className="relative">
          <Input
            removeWrapper
            type="tel"
            id="phone"
            size={!isDesktop2xl ? "xl" : "lg"}
            placeholder=" "
            disabled={isPending}
            {...register("phone")}
            className={cn("peer", {
              "border-destructive": errors.phone,
            })}
          />
          <Label
            htmlFor="phone"
            className="absolute text-sm text-default-600 duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-card px-2 peer-focus:px-2
               peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75
               peer-focus:-translate-y-4 rtl:peer-focus:translate-x-1/4 rtl:peer-focus:left-auto start-1"
          >
            Phone Number *
          </Label>
        </div>
        {errors.phone && (
          <div className="text-destructive text-sm">{errors.phone.message}</div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="relative">
            <Input
              removeWrapper
              type="date"
              id="dateOfBirth"
              size={!isDesktop2xl ? "xl" : "lg"}
              disabled={isPending}
              max={new Date().toISOString().split('T')[0]}
              min="1900-01-01"
              {...register("dateOfBirth")}
              className={cn("peer", {
                "border-destructive": errors.dateOfBirth,
              })}
            />
            <Label
              htmlFor="dateOfBirth"
              className="absolute text-sm text-default-600 duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-card px-2 peer-focus:px-2
                 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75
                 peer-focus:-translate-y-4 rtl:peer-focus:translate-x-1/4 rtl:peer-focus:left-auto start-1"
            >
              Date of Birth *
            </Label>
          </div>

          <div>
            <Select onValueChange={(value) => setValue("gender", value as "male" | "female" | "other")}>
              <SelectTrigger size={!isDesktop2xl ? "xl" : "lg"} className={cn({
                "border-destructive": errors.gender,
              })}>
                <SelectValue placeholder="Select Gender *" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            {errors.gender && (
              <div className="text-destructive mt-1 text-sm">{errors.gender.message}</div>
            )}
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Checkbox
            id="terms"
            className="border-default-300 mt-1"
            onCheckedChange={(checked) => setValue("acceptTerms", checked as boolean)}
          />
          <Label
            htmlFor="terms"
            className="text-sm font-medium text-default-600 cursor-pointer"
          >
            I accept the Terms & Conditions and Privacy Policy
          </Label>
        </div>
        {errors.acceptTerms && (
          <div className="text-destructive text-sm">{errors.acceptTerms.message}</div>
        )}

        <Button
          className="w-full"
          disabled={isPending}
          size={!isDesktop2xl ? "lg" : "md"}
          type="submit"
        >
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isPending ? "Completing Registration..." : "Complete Registration"}
        </Button>
      </form>
    </div>
  );
};

export default CompleteRegistrationForm;
