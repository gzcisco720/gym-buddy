import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import User from "@/lib/models/User";

/**
 * POST /api/user/fitness-profile
 * Save or update user's fitness profile
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
    const { fitnessProfile, gender } = body;

    // Validate required fields
    if (!fitnessProfile) {
      return NextResponse.json(
        { error: "Fitness profile data is required" },
        { status: 400 }
      );
    }

    const { weight, height, age, trainingLevel, activityLevel } = fitnessProfile;

    if (!weight || !height || !age || !trainingLevel || !activityLevel) {
      return NextResponse.json(
        { error: "Missing required fields: weight, height, age, trainingLevel, activityLevel" },
        { status: 400 }
      );
    }

    // Connect to database
    await connectToDatabase();

    // Build update object
    const updateData: any = {
      "fitnessProfile.weight": weight,
      "fitnessProfile.height": height,
      "fitnessProfile.age": age,
      "fitnessProfile.trainingLevel": trainingLevel,
      "fitnessProfile.activityLevel": activityLevel,
      "fitnessProfile.profileCompletedAt": new Date(),
    };

    // Add optional fields if provided
    if (fitnessProfile.bodyFatPercentage) {
      updateData["fitnessProfile.bodyFatPercentage"] = fitnessProfile.bodyFatPercentage;
    }

    if (fitnessProfile.leanBodyMass) {
      updateData["fitnessProfile.leanBodyMass"] = fitnessProfile.leanBodyMass;
    }

    if (fitnessProfile.trainingYears !== undefined && fitnessProfile.trainingYears !== null) {
      updateData["fitnessProfile.trainingYears"] = fitnessProfile.trainingYears;
    }

    // Update gender if provided
    if (gender) {
      updateData.gender = gender;
    }

    // Update user profile
    const updatedUser = await User.findByIdAndUpdate(
      session.user.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Fitness profile updated successfully",
      fitnessProfile: updatedUser.fitnessProfile,
    });
  } catch (error: any) {
    console.error("Error updating fitness profile:", error);

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

    return NextResponse.json(
      { error: "Failed to update fitness profile" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/user/fitness-profile
 * Get user's fitness profile
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

    // Get user profile
    const user = await User.findById(session.user.id).select("fitnessProfile gender");

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      fitnessProfile: user.fitnessProfile || null,
      gender: user.gender || null,
    });
  } catch (error: any) {
    console.error("Error fetching fitness profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch fitness profile" },
      { status: 500 }
    );
  }
}
