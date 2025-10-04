import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import User, { UserRole } from "@/lib/models/User";
import UserFitnessBasic from "@/lib/models/UserFitnessBasic";

export async function POST(request: NextRequest) {
  try {
    // Get the current session
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized - No active session" },
        { status: 401 }
      );
    }

    // Verify this is a new OAuth user who needs registration
    if (!session.user.needsRegistration) {
      return NextResponse.json(
        { error: "This endpoint is only for new OAuth users" },
        { status: 400 }
      );
    }

    // Parse request body
    const data = await request.json();
    const { 
      phone, 
      gender, 
      dateOfBirth,
      height,
      weight,
      trainingLevel,
      activityLevel,
      trainingYears
    } = data;

    // Validate required fields
    if (!phone || !gender || !dateOfBirth || !height || !weight || !trainingLevel || !activityLevel || trainingYears === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate gender
    if (!['male', 'female'].includes(gender)) {
      return NextResponse.json(
        { error: "Invalid gender value. Must be 'male' or 'female'" },
        { status: 400 }
      );
    }

    // Validate Australian phone number format
    const phoneRegex = /^(?:\+?61|0)(?:[2-478]\d{8}|4\d{8})$/;
    if (!phoneRegex.test(phone)) {
      return NextResponse.json(
        { error: "Invalid Australian phone number format" },
        { status: 400 }
      );
    }

    // Validate training level
    if (!['beginner', 'intermediate', 'advanced', 'elite'].includes(trainingLevel)) {
      return NextResponse.json(
        { error: "Invalid training level" },
        { status: 400 }
      );
    }

    // Validate activity level
    if (!['sedentary', 'lightlyActive', 'moderatelyActive', 'veryActive', 'extraActive'].includes(activityLevel)) {
      return NextResponse.json(
        { error: "Invalid activity level" },
        { status: 400 }
      );
    }

    // Connect to database
    await connectToDatabase();

    // Check if user already exists by email
    const existingUser = await User.findOne({ email: session.user.email?.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }

    // Calculate first training year
    const currentYear = new Date().getFullYear();
    const firstTrainingYear = currentYear - trainingYears;

    // Create new user with complete OAuth and profile data
    const newUser = await User.create({
      name: session.user.name || "User",
      email: session.user.email?.toLowerCase(),
      avatar: session.user.image,
      phone,
      gender,
      dateOfBirth: new Date(dateOfBirth),
      role: UserRole.USER,
      isActive: true,
      isEmailVerified: true, // OAuth users have verified emails
      lastLoginAt: new Date(),
    });

    // Create user fitness profile
    await UserFitnessBasic.create({
      userId: newUser._id,
      height,
      weight,
      trainingLevel,
      activityLevel,
      firstTrainingYear,
    });

    console.log("✅ OAuth user registration and fitness profile completed:", newUser._id.toString());

    return NextResponse.json(
      {
        success: true,
        message: "Registration completed successfully",
        user: {
          id: newUser._id.toString(),
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("❌ SSO registration error:", error);

    // Handle mongoose validation errors
    if (error instanceof Error && error.name === "ValidationError") {
      return NextResponse.json(
        { error: "Invalid data provided", details: error.message },
        { status: 400 }
      );
    }

    // Handle duplicate key error
    if (error instanceof Error && error.message.includes("duplicate key")) {
      return NextResponse.json(
        { error: "User with this email or phone already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
