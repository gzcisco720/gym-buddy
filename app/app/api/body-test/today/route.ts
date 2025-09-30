import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/mongodb';
import BodyMeasurement from '@/lib/models/BodyMeasurement';

// GET - Check if user has a measurement for today
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Get today's date range
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    // Check for existing measurement today
    const existingMeasurement = await BodyMeasurement.findOne({
      userId: session.user.id,
      measurementDate: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    }).select('measurementDate bodyComposition.bodyFatPercentage weight measurementMethod');

    return NextResponse.json({
      success: true,
      hasToday: !!existingMeasurement,
      todayMeasurement: existingMeasurement
    });

  } catch (error: any) {
    console.error('Body test today API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}