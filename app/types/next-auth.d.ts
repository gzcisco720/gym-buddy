import { UserRole } from "@/lib/models/User";
import { DefaultSession, DefaultUser } from "next-auth";
import { DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      isActive: boolean;
      onboardingCompleted?: boolean;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    role: UserRole;
    isActive: boolean;
    onboardingCompleted?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    userId: string;
    role: UserRole;
    isActive: boolean;
    onboardingCompleted?: boolean;
  }
}