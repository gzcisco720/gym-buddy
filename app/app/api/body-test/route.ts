import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/mongodb';
import BodyMeasurement, { MeasurementMethod, TrainingLevel } from '@/lib/models/BodyMeasurement';
import { calculateBodyComposition, calculateSkinfoldBodyFat, validateMeasurement } from '@/lib/calculations/bodyComposition';
import { calculatePowerliftingPredictions } from '@/lib/calculations/powerliftingPredictions';

// POST - Create new body measurement and calculations
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const body = await request.json();
    const {
      weight,
      height,
      age,
      gender,
      measurementMethod,
      skinfoldMeasurements,
      bioImpedanceData,
      trainingLevel = TrainingLevel.INTERMEDIATE,
      activityLevel = 'MODERATELY_ACTIVE',
      notes
    } = body;

    // Validate required fields
    if (!weight || !height || !age || !gender || !measurementMethod) {
      return NextResponse.json(
        { error: 'Missing required fields: weight, height, age, gender, measurementMethod' },
        { status: 400 }
      );
    }

    // Validate measurement values
    if (!validateMeasurement(weight, 'weight') ||
        !validateMeasurement(height, 'height') ||
        !validateMeasurement(age, 'age')) {
      return NextResponse.json(
        { error: 'Invalid measurement values' },
        { status: 400 }
      );
    }

    let bodyFatPercentage: number;

    // Calculate body fat percentage based on method
    try {
      switch (measurementMethod) {
        case MeasurementMethod.SKINFOLD_3_SITE:
        case MeasurementMethod.SKINFOLD_7_SITE:
        case MeasurementMethod.SKINFOLD_9_SITE:
          if (!skinfoldMeasurements) {
            throw new Error('Skinfold measurements required for selected method');
          }

          // Validate skinfold measurements
          for (const [key, value] of Object.entries(skinfoldMeasurements)) {
            if (value !== undefined && !validateMeasurement(value as number, 'skinfold')) {
              throw new Error(`Invalid skinfold measurement for ${key}: ${value}`);
            }
          }

          bodyFatPercentage = calculateSkinfoldBodyFat(
            skinfoldMeasurements,
            measurementMethod,
            age,
            gender
          );
          break;

        case MeasurementMethod.BIA:
          if (!bioImpedanceData?.resistance) {
            throw new Error('Bio-impedance data required for BIA method');
          }
          // For now, use a simplified BIA calculation
          // In a real implementation, you would use device-specific algorithms
          const resistance = bioImpedanceData.resistance;
          const heightSquared = (height / 100) ** 2;
          const impedanceIndex = heightSquared / resistance;

          // Simplified BIA formula (would need calibration with actual devices)
          bodyFatPercentage = gender === 'MALE'
            ? 20.94 - (0.78 * impedanceIndex) - (0.28 * age) + (1.33 * weight / heightSquared)
            : 32.03 - (0.69 * impedanceIndex) - (0.14 * age) + (0.40 * weight / heightSquared);

          // Clamp to reasonable range
          bodyFatPercentage = Math.max(3, Math.min(50, bodyFatPercentage));
          break;

        case MeasurementMethod.MANUAL_INPUT:
          if (!body.manualBodyFatPercentage) {
            throw new Error('Manual body fat percentage required for manual input method');
          }
          bodyFatPercentage = body.manualBodyFatPercentage;
          break;

        default:
          throw new Error(`Unsupported measurement method: ${measurementMethod}`);
      }

      // Validate calculated body fat percentage
      if (bodyFatPercentage < 1 || bodyFatPercentage > 60) {
        throw new Error(`Calculated body fat percentage out of range: ${bodyFatPercentage}%`);
      }

    } catch (calculationError: any) {
      return NextResponse.json(
        { error: `Calculation error: ${calculationError.message}` },
        { status: 400 }
      );
    }

    // Calculate comprehensive body composition
    const bodyComposition = calculateBodyComposition(
      weight,
      height,
      age,
      gender,
      bodyFatPercentage,
      activityLevel
    );

    // Calculate powerlifting predictions
    const powerliftingPredictions = calculatePowerliftingPredictions(
      bodyComposition.leanBodyMass,
      weight,
      trainingLevel,
      gender
    );

    // Check if there's already a measurement for today
    const measurementDate = body.measurementDate ? new Date(body.measurementDate) : new Date();

    // Set the date to the beginning of the day to ensure we're checking for the same calendar day
    const startOfDay = new Date(measurementDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(measurementDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Check for existing measurement on the same day
    const existingMeasurement = await BodyMeasurement.findOne({
      userId: session.user.id,
      measurementDate: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    });

    const measurementData = {
      userId: session.user.id,
      measurementDate,
      weight,
      height,
      age,
      gender,
      measurementMethod,
      skinfoldMeasurements,
      bioImpedanceData,
      bodyComposition: {
        bodyFatPercentage: bodyComposition.bodyFatPercentage,
        leanBodyMass: bodyComposition.leanBodyMass,
        fatMass: bodyComposition.fatMass,
        muscleMass: bodyComposition.muscleMass,
        totalBodyWater: bodyComposition.totalBodyWater,
        bmr: bodyComposition.bmr,
        tdee: bodyComposition.tdee
      },
      powerliftingPredictions: {
        benchPress1RM: powerliftingPredictions.benchPress1RM,
        squat1RM: powerliftingPredictions.squat1RM,
        deadlift1RM: powerliftingPredictions.deadlift1RM,
        total: powerliftingPredictions.total,
        wilksScore: powerliftingPredictions.wilksScore
      },
      trainingLevel,
      activityLevel,
      notes
    };

    let savedMeasurement;

    if (existingMeasurement) {
      // Update existing measurement (覆盖同一天的数据)
      savedMeasurement = await BodyMeasurement.findByIdAndUpdate(
        existingMeasurement._id,
        measurementData,
        { new: true, runValidators: true }
      );
    } else {
      // Create new measurement
      const newMeasurement = new BodyMeasurement(measurementData);
      savedMeasurement = await newMeasurement.save();
    }

    return NextResponse.json({
      success: true,
      isUpdate: !!existingMeasurement,
      message: existingMeasurement
        ? 'Today\'s measurement has been updated successfully!'
        : 'New measurement created successfully!',
      data: {
        measurement: savedMeasurement,
        strengthStandards: powerliftingPredictions.strengthStandards
      }
    });

  } catch (error: any) {
    console.error('Body test API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// GET - Retrieve user's body measurements
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const page = parseInt(searchParams.get('page') || '1');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let query: any = { userId: session.user.id };

    // Add date range filter if provided
    if (startDate || endDate) {
      query.measurementDate = {};
      if (startDate) query.measurementDate.$gte = new Date(startDate);
      if (endDate) query.measurementDate.$lte = new Date(endDate);
    }

    // Get total count
    const total = await BodyMeasurement.countDocuments(query);

    // Get measurements with pagination
    const measurements = await BodyMeasurement.find(query)
      .sort({ measurementDate: -1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .populate('userId', 'name email')
      .exec();

    return NextResponse.json({
      success: true,
      data: {
        measurements,
        pagination: {
          current: page,
          total: Math.ceil(total / limit),
          count: measurements.length,
          totalRecords: total
        }
      }
    });

  } catch (error: any) {
    console.error('Body test GET API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}