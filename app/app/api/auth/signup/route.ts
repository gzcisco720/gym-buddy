import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import User, { UserRole } from "@/lib/models/User";

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const data = await request.json();
    const {
      userType,
      name,
      email,
      password,
      phone,
    } = data;

    // Validate required fields
    if (!userType || !name || !email || !password || !phone) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Connect to database
    await connectToDatabase();

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }

    // Create new user with basic information
    const newUser = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      phone,
      role: userType === "trainer" ? UserRole.TRAINER : UserRole.MEMBER,
      isEmailVerified: false,
      registrationCompleted: true, // Registration is complete for credential signups
      onboardingCompleted: false, // User needs to complete fitness onboarding
      lastLoginAt: new Date(),
    });

    return NextResponse.json(
      {
        success: true,
        message: "Account created successfully",
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
    // Handle mongoose validation errors
    if (error instanceof Error && error.name === "ValidationError") {
      return NextResponse.json(
        { error: "Invalid data provided", details: error.message },
        { status: 400 }
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
