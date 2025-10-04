import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import User, { UserRole } from "@/lib/models/User";
import UserFitnessBasic from "@/lib/models/UserFitnessBasic";

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const data = await request.json();
    const {
      name,
      email,
      password,
      phone,
      gender,
      dateOfBirth,
      height,
      weight,
      trainingLevel,
      activityLevel,
      trainingYears,
    } = data;

    // Validate required fields
    if (!name || !email || !password || !phone || !gender || !dateOfBirth ||
        !height || !weight || !trainingLevel || !activityLevel || trainingYears === undefined) {
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

    // Calculate first training year
    const currentYear = new Date().getFullYear();
    const firstTrainingYear = currentYear - trainingYears;

    // Create new user with complete information
    const newUser = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      phone,
      gender,
      dateOfBirth: new Date(dateOfBirth),
      role: UserRole.USER,
      isActive: true,
      isEmailVerified: false,
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
