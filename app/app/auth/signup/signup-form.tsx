"use client";
import React, { useState } from "react";
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
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { Checkbox } from "@/components/ui/checkbox";
import { SiteLogo } from "@/components/svg";
import { useMediaQuery } from "@/hooks/use-media-query";

const schema = z.object({
  userType: z.enum(["member", "trainer"], { message: "Please select a user type" }),
  name: z.string().min(3, { message: "Name must be at least 3 characters." }),
  email: z.string().email({ message: "Your email is invalid." }),
  password: z.string().min(4, { message: "Password must be at least 4 characters." }),
  phone: z.string()
    .regex(/^(?:\+?61|0)(?:[2-478]\d{8}|4\d{8})$/, {
      message: "Please enter a valid Australian phone number (e.g., 0412345678 or +61412345678)"
    }),
  dateOfBirth: z.date({ message: "Please select your date of birth." }),
  gender: z.enum(["male", "female", "other"], { message: "Please select your gender" }),
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: "You must accept the terms and conditions",
  }),
});

type FormData = z.infer<typeof schema>;

const SignupForm = () => {
  const [isPending, startTransition] = React.useTransition();
  const [passwordType, setPasswordType] = useState("password");
  const isDesktop2xl = useMediaQuery("(max-width: 1530px)");
  
  const togglePasswordType = () => {
    if (passwordType === "text") {
      setPasswordType("password");
    } else if (passwordType === "password") {
      setPasswordType("text");
    }
  };
  
  const router = useRouter();
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: "all",
    defaultValues: {
      userType: "member",
      acceptTerms: false,
    }
  });

  const watchedUserType = watch("userType");

  const onSubmit = (data: FormData) => {
    startTransition(async () => {
      try {
        const response = await fetch("/api/auth/signup", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to create account");
        }

        toast.success("Account created successfully! Please sign in.");
        reset();
        router.push("/auth/login");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to create account. Please try again.");
      }
    });
  };

  const handleUserTypeChange = (value: "member" | "trainer") => {
    setValue("userType", value);
  };

  return (
    <div className="w-full">
      <Link href="/dashboard" className="inline-block">
        <SiteLogo className="h-10 w-10 2xl:w-14 2xl:h-14 text-primary" />
      </Link>
      <div className="2xl:mt-8 mt-6 2xl:text-3xl text-2xl font-bold text-default-900">
        Join Gym Buddy 💪
      </div>
      <div className="2xl:text-lg text-base text-default-600 mt-2 leading-6">
        Create your account to start your fitness journey
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)} className="mt-5 xl:mt-7">
        {/* User Type Selection */}
        <div className="mb-6">
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
            <div className="text-destructive mt-2">{errors.userType.message}</div>
          )}
        </div>

        {/* Basic Information */}
        <div className="relative">
          <Input
            removeWrapper
            type="text"
            id="name"
            size={!isDesktop2xl ? "xl" : "lg"}
            placeholder=" "
            disabled={isPending}
            {...register("name")}
            className={cn("peer", {
              "border-destructive": errors.name,
            })}
          />
          <Label
            htmlFor="name"
            className="absolute text-base text-default-600 duration-300 transform -translate-y-5 scale-75 top-2 z-10 origin-[0] bg-background px-2 peer-focus:px-2
               peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 
               peer-focus:-translate-y-4 rtl:peer-focus:translate-x-1/4 rtl:peer-focus:left-auto start-1"
          >
            Full Name
          </Label>
        </div>
        {errors.name && (
          <div className="text-destructive mt-2">{errors.name.message}</div>
        )}

        <div className="relative mt-4">
          <Input
            removeWrapper
            type="email"
            id="email"
            size={!isDesktop2xl ? "xl" : "lg"}
            placeholder=" "
            disabled={isPending}
            {...register("email")}
            className={cn("peer", {
              "border-destructive": errors.email,
            })}
          />
          <Label
            htmlFor="email"
            className="absolute text-base text-default-600 duration-300 transform -translate-y-5 scale-75 top-2 z-10 origin-[0] bg-background px-2 peer-focus:px-2
               peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 
               peer-focus:-translate-y-4 rtl:peer-focus:translate-x-1/4 rtl:peer-focus:left-auto start-1"
          >
            Email
          </Label>
        </div>
        {errors.email && (
          <div className="text-destructive mt-2">{errors.email.message}</div>
        )}

        <div className="relative mt-4">
          <Input
            removeWrapper
            type={passwordType}
            id="password"
            size={!isDesktop2xl ? "xl" : "lg"}
            placeholder=" "
            disabled={isPending}
            {...register("password")}
            className={cn("peer", {
              "border-destructive": errors.password,
            })}
          />
          <Label
            htmlFor="password"
            className="absolute text-base text-default-600 duration-300 transform -translate-y-5 scale-75 top-2 z-10 origin-[0] bg-background px-2 peer-focus:px-2
               peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 
               peer-focus:-translate-y-4 rtl:peer-focus:translate-x-1/4 rtl:peer-focus:left-auto start-1"
          >
            Password
          </Label>
          <div
            className="absolute top-1/2 -translate-y-1/2 ltr:right-4 rtl:left-4 cursor-pointer"
            onClick={togglePasswordType}
          >
            {passwordType === "password" ? (
              <Icon icon="heroicons:eye" className="w-5 h-5 text-default-400" />
            ) : (
              <Icon
                icon="heroicons:eye-slash"
                className="w-5 h-5 text-default-400"
              />
            )}
          </div>
        </div>
        {errors.password && (
          <div className="text-destructive mt-2">
            {errors.password.message}
          </div>
        )}

        <div className="relative mt-4">
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
            className="absolute text-base text-default-600 duration-300 transform -translate-y-5 scale-75 top-2 z-10 origin-[0] bg-background px-2 peer-focus:px-2
               peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 
               peer-focus:-translate-y-4 rtl:peer-focus:translate-x-1/4 rtl:peer-focus:left-auto start-1"
          >
            Phone Number
          </Label>
        </div>
        {errors.phone && (
          <div className="text-destructive mt-2">{errors.phone.message}</div>
        )}

        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="relative">
            <Input
              removeWrapper
              type="date"
              id="dateOfBirth"
              size={!isDesktop2xl ? "xl" : "lg"}
              disabled={isPending}
              max={new Date().toISOString().split('T')[0]}
              min="1900-01-01"
              onChange={(e) => {
                const date = e.target.value ? new Date(e.target.value) : undefined;
                if (date) {
                  setValue("dateOfBirth", date);
                }
              }}
              className={cn("peer", {
                "border-destructive": errors.dateOfBirth,
              })}
            />
            <Label
              htmlFor="dateOfBirth"
              className="absolute text-base text-default-600 duration-300 transform -translate-y-5 scale-75 top-2 z-10 origin-[0] bg-background px-2 peer-focus:px-2
                 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 
                 peer-focus:-translate-y-4 rtl:peer-focus:translate-x-1/4 rtl:peer-focus:left-auto start-1"
            >
              Date of Birth
            </Label>
          </div>
          
          <div>
            <Select onValueChange={(value) => setValue("gender", value as "male" | "female" | "other")}>
              <SelectTrigger size={!isDesktop2xl ? "xl" : "lg"} className={cn({
                "border-destructive": errors.gender,
              })}>
                <SelectValue placeholder="Select Gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        {(errors.dateOfBirth || errors.gender) && (
          <div className="text-destructive mt-2">
            {errors.dateOfBirth?.message || errors.gender?.message}
          </div>
        )}

        <div className="mt-5 flex items-center gap-3 mb-8">
          <Checkbox
            id="terms"
            className="border-default-300"
            onCheckedChange={(checked) => setValue("acceptTerms", checked as boolean)}
          />
          <Label
            htmlFor="terms"
            className="text-base font-medium text-default-600 cursor-pointer"
          >
            You accept our Terms & Conditions and Privacy Policy
          </Label>
        </div>
        {errors.acceptTerms && (
          <div className="text-destructive text-sm mb-4">{errors.acceptTerms.message}</div>
        )}

        <Button
          className="w-full"
          disabled={isPending}
          size={!isDesktop2xl ? "lg" : "md"}
        >
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isPending ? "Creating Account..." : "Create Account"}
        </Button>
      </form>

      <div className="mt-5 2xl:mt-8 text-center text-base text-default-600">
        Already have an account?{" "}
        <Link href="/auth/login" className="text-primary">
          Sign In
        </Link>
      </div>
    </div>
  );
};

export default SignupForm;