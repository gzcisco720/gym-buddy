"use client";
import Image from "next/image";
import lightImage from "@/public/images/error/light-401.png";
import darkImage from "@/public/images/error/dark-401.png";
import { Button } from "@/components/ui/button";
import { signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import { LogOut } from "lucide-react";

const InactivePage = () => {
  const { theme } = useTheme();

  const handleSignOut = () => {
    signOut({ callbackUrl: "/auth/login" });
  };

  return (
    <div className="min-h-screen overflow-y-auto flex justify-center items-center p-10">
      <div className="w-full flex flex-col items-center">
        <div className="max-w-[542px]">
          <Image
            src={theme === "dark" ? darkImage : lightImage}
            alt="unauthorized access image"
            className="w-full h-full object-cover"
            priority={true}
          />
        </div>
        <div className="mt-16 text-center">
          <div className="text-2xl md:text-4xl lg:text-5xl font-semibold text-default-900">
            Account Inactive
          </div>
          <div className="mt-3 text-default-600 text-sm md:text-base">
            Your account has been deactivated. Please contact your gym <br />
            administrator to reactivate your account.
          </div>
          <div className="mt-9 flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={handleSignOut} className="md:min-w-[200px]" size="lg">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InactivePage;