import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import User, { UserRole } from "@/lib/models/User";

export async function POST(request: NextRequest) {
  try {
    // Get current session
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized - Please sign in first" },
        { status: 401 }
      );
    }

    // Parse request body
    const data = await request.json();
    const {
      userType,
      phone,
      dateOfBirth,
      gender,
    } = data;

    // Validate required fields
    if (!userType || !phone || !dateOfBirth || !gender) {
      return NextResponse.json(
        { error: "Missing required fields" },
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

    // Check if already completed registration
    if (user.registrationCompleted) {
      return NextResponse.json(
        { error: "Registration already completed" },
        { status: 400 }
      );
    }

    // Prepare update data - only basic user info
    const updateData: any = {
      role: userType === "trainer" ? UserRole.TRAINER : UserRole.MEMBER,
      phone,
      dateOfBirth: new Date(dateOfBirth),
      gender: gender ? gender.toLowerCase() : undefined,
      registrationCompleted: true,
      lastLoginAt: new Date(),
    };

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      session.user.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return NextResponse.json(
        { error: "Failed to update user" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Registration completed successfully",
        user: {
          id: updatedUser._id.toString(),
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
          registrationCompleted: updatedUser.registrationCompleted,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
