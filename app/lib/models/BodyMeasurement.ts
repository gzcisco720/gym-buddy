import mongoose, { Document, Schema } from 'mongoose';

// Measurement Method Enum
export enum MeasurementMethod {
  SKINFOLD_3_SITE = 'SKINFOLD_3_SITE',
  SKINFOLD_7_SITE = 'SKINFOLD_7_SITE',
  SKINFOLD_9_SITE = 'SKINFOLD_9_SITE',
  BIA = 'BIA', // Bioelectrical Impedance Analysis
  DEXA = 'DEXA',
  MANUAL_INPUT = 'MANUAL_INPUT'
}

// Training Level for powerlifting predictions
export enum TrainingLevel {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED',
  ELITE = 'ELITE'
}

// Skinfold measurement sites
export interface SkinfoldMeasurements {
  // 3-site measurements
  chest?: number; // mm
  abdomen?: number; // mm
  thigh?: number; // mm

  // Additional sites for 7-site and 9-site
  triceps?: number; // mm
  subscapular?: number; // mm
  suprailiac?: number; // mm
  midaxillary?: number; // mm

  // Additional sites for 9-site
  calf?: number; // mm
  biceps?: number; // mm
}

// Body composition results
export interface BodyComposition {
  bodyFatPercentage: number; // %
  leanBodyMass: number; // kg
  fatMass: number; // kg
  muscleMass?: number; // kg
  totalBodyWater?: number; // kg
  boneMass?: number; // kg
  bmr: number; // kcal/day (Basal Metabolic Rate)
  tdee: number; // kcal/day (Total Daily Energy Expenditure)
}

// Powerlifting predictions
export interface PowerliftingPredictions {
  benchPress1RM: number; // kg
  squat1RM: number; // kg
  deadlift1RM: number; // kg
  total: number; // kg (sum of all three)
  wilksScore?: number; // Wilks coefficient score
}

// Body Measurement Interface
export interface IBodyMeasurement extends Document {
  _id: string;
  userId: mongoose.Types.ObjectId; // Reference to User model
  measurementDate: Date;

  // Basic measurements
  weight: number; // kg
  height: number; // cm
  age: number; // years
  gender: 'MALE' | 'FEMALE';

  // Measurement method and data
  measurementMethod: MeasurementMethod;
  skinfoldMeasurements?: SkinfoldMeasurements;
  bioImpedanceData?: {
    resistance: number; // ohms
    reactance?: number; // ohms
  };

  // Calculated results
  bodyComposition: BodyComposition;
  powerliftingPredictions: PowerliftingPredictions;

  // Training context
  trainingLevel: TrainingLevel;
  activityLevel: 'SEDENTARY' | 'LIGHTLY_ACTIVE' | 'MODERATELY_ACTIVE' | 'VERY_ACTIVE' | 'EXTRA_ACTIVE';

  // Additional notes
  notes?: string;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// Body Measurement Schema
const BodyMeasurementSchema = new Schema<IBodyMeasurement>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  measurementDate: {
    type: Date,
    required: [true, 'Measurement date is required'],
    default: Date.now
  },

  // Basic measurements
  weight: {
    type: Number,
    required: [true, 'Weight is required'],
    min: [20, 'Weight must be at least 20kg'],
    max: [500, 'Weight cannot exceed 500kg']
  },
  height: {
    type: Number,
    required: [true, 'Height is required'],
    min: [100, 'Height must be at least 100cm'],
    max: [250, 'Height cannot exceed 250cm']
  },
  age: {
    type: Number,
    required: [true, 'Age is required'],
    min: [13, 'Age must be at least 13'],
    max: [100, 'Age cannot exceed 100']
  },
  gender: {
    type: String,
    enum: ['MALE', 'FEMALE'],
    required: [true, 'Gender is required']
  },

  // Measurement method and data
  measurementMethod: {
    type: String,
    enum: Object.values(MeasurementMethod),
    required: [true, 'Measurement method is required']
  },
  skinfoldMeasurements: {
    chest: {
      type: Number,
      min: [2, 'Skinfold measurement must be at least 2mm'],
      max: [50, 'Skinfold measurement cannot exceed 50mm']
    },
    abdomen: {
      type: Number,
      min: [2, 'Skinfold measurement must be at least 2mm'],
      max: [50, 'Skinfold measurement cannot exceed 50mm']
    },
    thigh: {
      type: Number,
      min: [2, 'Skinfold measurement must be at least 2mm'],
      max: [50, 'Skinfold measurement cannot exceed 50mm']
    },
    triceps: {
      type: Number,
      min: [2, 'Skinfold measurement must be at least 2mm'],
      max: [50, 'Skinfold measurement cannot exceed 50mm']
    },
    subscapular: {
      type: Number,
      min: [2, 'Skinfold measurement must be at least 2mm'],
      max: [50, 'Skinfold measurement cannot exceed 50mm']
    },
    suprailiac: {
      type: Number,
      min: [2, 'Skinfold measurement must be at least 2mm'],
      max: [50, 'Skinfold measurement cannot exceed 50mm']
    },
    midaxillary: {
      type: Number,
      min: [2, 'Skinfold measurement must be at least 2mm'],
      max: [50, 'Skinfold measurement cannot exceed 50mm']
    },
    calf: {
      type: Number,
      min: [2, 'Skinfold measurement must be at least 2mm'],
      max: [50, 'Skinfold measurement cannot exceed 50mm']
    },
    biceps: {
      type: Number,
      min: [2, 'Skinfold measurement must be at least 2mm'],
      max: [50, 'Skinfold measurement cannot exceed 50mm']
    }
  },
  bioImpedanceData: {
    resistance: {
      type: Number,
      min: [1, 'Resistance must be positive'],
      max: [2000, 'Resistance value seems too high']
    },
    reactance: {
      type: Number,
      min: [1, 'Reactance must be positive'],
      max: [200, 'Reactance value seems too high']
    }
  },

  // Calculated results
  bodyComposition: {
    bodyFatPercentage: {
      type: Number,
      required: true,
      min: [1, 'Body fat percentage must be at least 1%'],
      max: [60, 'Body fat percentage cannot exceed 60%']
    },
    leanBodyMass: {
      type: Number,
      required: true,
      min: [10, 'Lean body mass must be at least 10kg']
    },
    fatMass: {
      type: Number,
      required: true,
      min: [1, 'Fat mass must be at least 1kg']
    },
    muscleMass: {
      type: Number,
      min: [5, 'Muscle mass must be at least 5kg']
    },
    totalBodyWater: {
      type: Number,
      min: [5, 'Total body water must be at least 5kg']
    },
    boneMass: {
      type: Number,
      min: [1, 'Bone mass must be at least 1kg']
    },
    bmr: {
      type: Number,
      required: true,
      min: [800, 'BMR seems too low'],
      max: [4000, 'BMR seems too high']
    },
    tdee: {
      type: Number,
      required: true,
      min: [1000, 'TDEE seems too low'],
      max: [6000, 'TDEE seems too high']
    }
  },

  powerliftingPredictions: {
    benchPress1RM: {
      type: Number,
      required: true,
      min: [20, 'Bench press 1RM prediction seems too low'],
      max: [500, 'Bench press 1RM prediction seems too high']
    },
    squat1RM: {
      type: Number,
      required: true,
      min: [30, 'Squat 1RM prediction seems too low'],
      max: [800, 'Squat 1RM prediction seems too high']
    },
    deadlift1RM: {
      type: Number,
      required: true,
      min: [40, 'Deadlift 1RM prediction seems too low'],
      max: [900, 'Deadlift 1RM prediction seems too high']
    },
    total: {
      type: Number,
      required: true
    },
    wilksScore: {
      type: Number,
      min: [0, 'Wilks score cannot be negative'],
      max: [1000, 'Wilks score seems too high']
    }
  },

  // Training context
  trainingLevel: {
    type: String,
    enum: Object.values(TrainingLevel),
    required: [true, 'Training level is required'],
    default: TrainingLevel.BEGINNER
  },
  activityLevel: {
    type: String,
    enum: ['SEDENTARY', 'LIGHTLY_ACTIVE', 'MODERATELY_ACTIVE', 'VERY_ACTIVE', 'EXTRA_ACTIVE'],
    required: [true, 'Activity level is required'],
    default: 'MODERATELY_ACTIVE'
  },

  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
BodyMeasurementSchema.index({ userId: 1, measurementDate: -1 });
BodyMeasurementSchema.index({ measurementDate: -1 });
BodyMeasurementSchema.index({ userId: 1, createdAt: -1 });

// Compound unique index to ensure one measurement per user per day
BodyMeasurementSchema.index(
  {
    userId: 1,
    measurementDate: 1
  },
  {
    unique: true,
    partialFilterExpression: {
      measurementDate: { $type: 'date' }
    }
  }
);

// Virtual for user reference
BodyMeasurementSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

// Pre-save middleware to calculate total powerlifting score
BodyMeasurementSchema.pre('save', function(next) {
  if (this.powerliftingPredictions) {
    this.powerliftingPredictions.total =
      this.powerliftingPredictions.benchPress1RM +
      this.powerliftingPredictions.squat1RM +
      this.powerliftingPredictions.deadlift1RM;
  }
  next();
});

// Static methods
BodyMeasurementSchema.statics.findByUser = function(userId: mongoose.Types.ObjectId) {
  return this.find({ userId }).sort({ measurementDate: -1 });
};

BodyMeasurementSchema.statics.findLatestByUser = function(userId: mongoose.Types.ObjectId) {
  return this.findOne({ userId }).sort({ measurementDate: -1 });
};

BodyMeasurementSchema.statics.findByDateRange = function(
  userId: mongoose.Types.ObjectId,
  startDate: Date,
  endDate: Date
) {
  return this.find({
    userId,
    measurementDate: {
      $gte: startDate,
      $lte: endDate
    }
  }).sort({ measurementDate: -1 });
};

// Export the model
export default mongoose.models.BodyMeasurement || mongoose.model<IBodyMeasurement>('BodyMeasurement', BodyMeasurementSchema);