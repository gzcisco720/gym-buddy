import { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import GithubProvider from "next-auth/providers/github";
import connectToDatabase from "./mongodb";
import User, { UserRole, IUser } from "./models/User";

export const authOptions: NextAuthOptions = {
  // No adapter - we handle user creation manually in JWT callback
  // This gives us full control over the user creation process

  providers: [
    GoogleProvider({
      clientId: process.env.AUTH_GOOGLE_ID as string,
      clientSecret: process.env.AUTH_GOOGLE_SECRET as string,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          role: UserRole.MEMBER, // Default role for new Google users
          isActive: true, // Default active status for new OAuth users
        };
      },
    }),
    GithubProvider({
      clientId: process.env.AUTH_GITHUB_ID as string,
      clientSecret: process.env.AUTH_GITHUB_SECRET as string,
      profile(profile) {
        return {
          id: profile.id.toString(),
          name: profile.name || profile.login,
          email: profile.email,
          image: profile.avatar_url,
          role: UserRole.MEMBER, // Default role for new GitHub users
          isActive: true, // Default active status for new OAuth users
        };
      },
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        try {
          // Connect to database
          await connectToDatabase();

          // Find user by email with password field
          const user = await User.findOne({ email: credentials.email.toLowerCase() })
            .select("+password")
            .lean() as (IUser & { password: string }) | null;

          if (!user) {
            throw new Error("No user found with this email");
          }

          // Check if user is active
          if (!user.isActive) {
            throw new Error("Account is deactivated. Please contact administrator");
          }

          // Verify password
          const isValidPassword = await User.schema.methods.comparePassword.call(
            user,
            credentials.password
          );

          if (!isValidPassword) {
            throw new Error("Invalid password");
          }

          // Update last login
          await User.findByIdAndUpdate(user._id, {
            lastLoginAt: new Date(),
          });

          // Return user object (without password)
          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            image: user.avatar,
            role: user.role,
            isActive: user.isActive,
          };
        } catch (error) {
          console.error("Authentication error:", error);
          throw new Error("Authentication failed");
        }
      },
    }),
  ],

  session: {
    strategy: "jwt",
    maxAge: parseInt(process.env.JWT_EXPIRES_IN || "86400"), // 24 hours
  },

  callbacks: {
    async jwt({ token, user, account, trigger }) {
      // Initial credential sign in
      if (user && !account) {
        token.role = user.role;
        token.userId = user.id;
        token.isActive = user.isActive;
        // Fetch onboarding status from database
        try {
          await connectToDatabase();
          const dbUser = await User.findById(user.id).lean() as IUser | null;
          token.onboardingCompleted = dbUser?.onboardingCompleted || false;
        } catch (error) {
          console.error("Error fetching onboarding status:", error);
          token.onboardingCompleted = false;
        }
      }

      // Handle OAuth sign-ins
      if (account && (account.provider === "google" || account.provider === "github")) {
        try {
          await connectToDatabase();

          // Find existing user by email
          let dbUser = await User.findOne({ email: token.email });

          if (!dbUser) {
            // Create new OAuth user with onboardingCompleted = false
            dbUser = await User.create({
              name: token.name,
              email: token.email,
              avatar: token.picture,
              role: UserRole.MEMBER,
              isActive: true,
              isEmailVerified: true,
              registrationCompleted: false,
              onboardingCompleted: false, // New users need to complete onboarding
              providers: {
                [account.provider]: {
                  id: account.providerAccountId,
                  verified: true,
                },
              },
            });
            console.log("✅ Created new OAuth user - onboardingCompleted:", dbUser.onboardingCompleted);
          } else {
            // Update existing user with OAuth provider info
            await User.findByIdAndUpdate(dbUser._id, {
              $set: {
                [`providers.${account.provider}`]: {
                  id: account.providerAccountId,
                  verified: true,
                },
                lastLoginAt: new Date(),
              },
            });
            console.log("✅ Existing user found - onboardingCompleted:", dbUser.onboardingCompleted);
          }

          // Set token fields from database user
          token.role = dbUser.role;
          token.userId = dbUser._id.toString();
          token.isActive = dbUser.isActive;
          token.trainerId = dbUser.trainerId?.toString();
          token.onboardingCompleted = dbUser.onboardingCompleted || false;

          console.log("🔑 JWT Token set - onboardingCompleted:", token.onboardingCompleted);
        } catch (error) {
          console.error("❌ OAuth user creation/update error:", error);
          throw error; // Fail the sign-in if we can't create/update user
        }
      }

      // On session update trigger, refresh user data from database
      // This only runs when explicitly triggered (e.g., after onboarding completion)
      // Not on every request, which improves performance
      if (trigger === "update" && token.userId) {
        try {
          await connectToDatabase();
          const dbUser = await User.findById(token.userId).lean() as IUser | null;

          if (dbUser) {
            token.role = dbUser.role;
            token.isActive = dbUser.isActive;
            token.onboardingCompleted = dbUser.onboardingCompleted || false;
          }
        } catch (error) {
          console.error("Error refreshing user data:", error);
        }
      }

      return token;
    },

    async session({ session, token }) {
      // Add custom fields to session
      if (token) {
        session.user.id = token.userId as string;
        session.user.role = token.role as UserRole;
        session.user.isActive = token.isActive as boolean;
        session.user.onboardingCompleted = token.onboardingCompleted as boolean;
      }

      return session;
    },

    async signIn({ user, account }) {
      // Allow all credential sign-ins that pass authorization
      if (account?.provider === "credentials") {
        return true;
      }

      // For OAuth, ensure user is active
      if (user.isActive === false) {
        return false;
      }

      return true;
    },

    async redirect({ url, baseUrl }) {
      // Allow explicit redirects
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      else if (new URL(url).origin === baseUrl) return url;

      // Default redirect to dashboard
      return `${baseUrl}/overview`;
    },
  },

  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },

  events: {
    async signIn({ user, account }) {
      console.log(`User ${user.email} signed in with ${account?.provider || "credentials"}`);
    },
    async signOut({ token }) {
      console.log(`User ${token?.email} signed out`);
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};
