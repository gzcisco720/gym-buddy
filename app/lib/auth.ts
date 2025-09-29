import { NextAuthOptions } from "next-auth";
import { MongoDBAdapter } from "@next-auth/mongodb-adapter";
import { MongoClient } from "mongodb";
import Credentials from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import GithubProvider from "next-auth/providers/github";
import connectToDatabase from "./mongodb";
import User, { UserRole, IUser } from "./models/User";
import TrainerMemberRelation from "./models/TrainerMemberRelation";

// MongoDB client for NextAuth adapter
const client = new MongoClient(process.env.MONGODB_URI!);
const clientPromise = client.connect();

export const authOptions: NextAuthOptions = {
  // MongoDB adapter for session and account management
  adapter: MongoDBAdapter(clientPromise),

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
            .lean();

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
          const { password, ...userWithoutPassword } = user;
          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            image: user.avatar,
            role: user.role,
            isActive: user.isActive,
            trainerId: user.trainerId?.toString(),
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
    async jwt({ token, user, account }) {
      // Initial sign in
      if (user) {
        token.role = user.role;
        token.userId = user.id;
        token.isActive = user.isActive;
        token.trainerId = user.trainerId;
      }

      // Handle OAuth sign-ins
      if (account && (account.provider === "google" || account.provider === "github")) {
        try {
          await connectToDatabase();

          // Find or create user
          let dbUser = await User.findOne({ email: token.email });

          if (!dbUser) {
            // Create new user for OAuth
            dbUser = await User.create({
              name: token.name,
              email: token.email,
              avatar: token.picture,
              role: UserRole.MEMBER,
              isActive: true,
              isEmailVerified: true,
              providers: {
                [account.provider]: {
                  id: account.providerAccountId,
                  verified: true,
                },
              },
            });
          } else {
            // Update existing user with OAuth info
            await User.findByIdAndUpdate(dbUser._id, {
              $set: {
                [`providers.${account.provider}`]: {
                  id: account.providerAccountId,
                  verified: true,
                },
                lastLoginAt: new Date(),
              },
            });
          }

          token.role = dbUser.role;
          token.userId = dbUser._id.toString();
          token.isActive = dbUser.isActive;
          token.trainerId = dbUser.trainerId?.toString();
        } catch (error) {
          console.error("OAuth user creation/update error:", error);
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
        session.user.trainerId = token.trainerId as string;
      }

      return session;
    },

    async signIn({ user, account, profile }) {
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
      // Redirect to dashboard after successful sign in
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      else if (new URL(url).origin === baseUrl) return url;
      return `${baseUrl}/dashboard`;
    },
  },

  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },

  events: {
    async signIn({ user, account, isNewUser }) {
      console.log(`User ${user.email} signed in with ${account?.provider || "credentials"}`);
    },
    async signOut({ token }) {
      console.log(`User ${token?.email} signed out`);
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};
