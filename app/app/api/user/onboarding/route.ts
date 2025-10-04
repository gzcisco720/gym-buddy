import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import User, { UserRole } from "@/lib/models/User";
import UserStaticProfile from "@/lib/models/UserStaticProfile";
import BodyComposition from "@/lib/models/BodyComposition";

/**
 * POST /api/user/onboarding
 * Unified endpoint for completing user registration and onboarding
 * Handles both trainer (basic info only) and member (full fitness profile)
 */
export async function POST(req: NextRequest) {
  try {
    // Get authenticated session
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await req.json();
    const { userType, phone, staticProfile, bodyComposition } = body;

    // Validate required fields for all users
    if (!userType || !phone) {
      return NextResponse.json(
        { error: "User type and phone number are required" },
        { status: 400 }
      );
    }

    // Connect to database
    await connectToDatabase();

    // Find user
    const user = await User.findById(session.user.id);

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check if already completed onboarding
    if (user.onboardingCompleted) {
      return NextResponse.json(
        { error: "Onboarding already completed" },
        { status: 400 }
      );
    }

    // Determine role based on userType
    const role = userType === "trainer" ? UserRole.TRAINER : UserRole.MEMBER;

    // Update basic user info (for all users)
    const userUpdateData: any = {
      role,
      phone,
      registrationCompleted: true,
      lastLoginAt: new Date(),
    };

    // If trainer, complete onboarding immediately (no fitness profile needed)
    if (userType === "trainer") {
      userUpdateData.onboardingCompleted = true;

      const updatedUser = await User.findByIdAndUpdate(
        session.user.id,
        userUpdateData,
        { new: true, runValidators: true }
      );

      return NextResponse.json({
        success: true,
        message: "Trainer onboarding completed successfully",
        user: {
          id: updatedUser._id.toString(),
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
          onboardingCompleted: updatedUser.onboardingCompleted,
        },
      });
    }

    // Member flow: Validate fitness profile data
    if (!staticProfile || !bodyComposition) {
      return NextResponse.json(
        { error: "Static profile and body composition data are required for members" },
        { status: 400 }
      );
    }

    // Validate static profile fields
    const {
      gender,
      dateOfBirth,
      height,
      trainingLevel,
      activityLevel,
      firstTrainingYear,
    } = staticProfile;

    if (
      !gender ||
      !dateOfBirth ||
      !height ||
      !trainingLevel ||
      !activityLevel ||
      !firstTrainingYear
    ) {
      return NextResponse.json(
        {
          error:
            "Missing required static profile fields: gender, dateOfBirth, height, trainingLevel, activityLevel, firstTrainingYear",
        },
        { status: 400 }
      );
    }

    // Validate body composition fields
    const { weight } = bodyComposition;

    if (!weight) {
      return NextResponse.json(
        { error: "Missing required body composition field: weight" },
        { status: 400 }
      );
    }

    // Check if user already has a fitness profile
    const existingProfile = await UserStaticProfile.findOne({
      userId: session.user.id,
    });

    if (existingProfile) {
      return NextResponse.json(
        { error: "Fitness profile already exists" },
        { status: 400 }
      );
    }

    // Create static profile for member
    const newStaticProfile = await UserStaticProfile.create({
      userId: session.user.id,
      gender,
      dateOfBirth: new Date(dateOfBirth),
      height,
      trainingLevel,
      activityLevel,
      firstTrainingYear,
      profileCompletedAt: new Date(),
    });

    // Create initial body composition record for member
    const newBodyComposition = await BodyComposition.createCurrent(
      session.user.id,
      {
        weight,
        bodyFatPercentage: bodyComposition.bodyFatPercentage,
        leanBodyMass: bodyComposition.leanBodyMass,
        measurementMethod: "manual",
      }
    );

    // Update user with member-specific completion
    userUpdateData.onboardingCompleted = true;
    const updatedUser = await User.findByIdAndUpdate(
      session.user.id,
      userUpdateData,
      { new: true, runValidators: true }
    );

    return NextResponse.json({
      success: true,
      message: "Member onboarding completed successfully",
      user: {
        id: updatedUser._id.toString(),
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        onboardingCompleted: updatedUser.onboardingCompleted,
      },
      data: {
        staticProfile: newStaticProfile,
        bodyComposition: newBodyComposition,
      },
    });
  } catch (error: any) {
    console.error("Error completing onboarding:", error);

    // Handle validation errors
    if (error.name === "ValidationError") {
      const validationErrors = Object.values(error.errors).map(
        (err: any) => err.message
      );
      return NextResponse.json(
        { error: "Validation failed", details: validationErrors },
        { status: 400 }
      );
    }

    // Handle duplicate key error
    if (error.code === 11000) {
      return NextResponse.json(
        { error: "Profile already exists" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to complete onboarding" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/user/onboarding
 * Get user's complete onboarding data
 */
export async function GET(req: NextRequest) {
  try {
    // Get authenticated session
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Connect to database
    await connectToDatabase();

    // Get static profile
    const staticProfile = await UserStaticProfile.findOne({
      userId: session.user.id,
    });

    // Get current body composition
    const currentComposition = await BodyComposition.getCurrentComposition(
      session.user.id
    );

    // Get user onboarding status
    const user = await User.findById(session.user.id).select(
      "onboardingCompleted"
    );

    return NextResponse.json({
      success: true,
      data: {
        onboardingCompleted: user?.onboardingCompleted || false,
        staticProfile: staticProfile || null,
        currentBodyComposition: currentComposition || null,
      },
    });
  } catch (error: any) {
    console.error("Error fetching onboarding data:", error);
    return NextResponse.json(
      { error: "Failed to fetch onboarding data" },
      { status: 500 }
    );
  }
}
