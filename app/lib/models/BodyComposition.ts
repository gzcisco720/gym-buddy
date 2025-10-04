import mongoose, { Document, Schema, Model } from 'mongoose';

/**
 * Body Composition - Variable Data with History Tracking
 * This collection stores body measurements that change frequently
 * Each record represents a measurement at a specific point in time
 */

// Static methods interface
export interface IBodyCompositionModel extends Model<IBodyComposition> {
  getCurrentComposition(userId: string): Promise<IBodyComposition | null>;
  getHistory(userId: string, limit?: number): Promise<IBodyComposition[]>;
  getCompositionAtDate(userId: string, date: Date): Promise<IBodyComposition | null>;
  createCurrent(userId: string, data: Partial<IBodyComposition>): Promise<IBodyComposition>;
}

export interface IBodyComposition extends Document {
  _id: string;
  userId: mongoose.Types.ObjectId; // Reference to User

  // Core Measurements
  weight: number; // kg
  bodyFatPercentage?: number; // %
  leanBodyMass?: number; // kg (auto-calculated)

  // Measurement Details
  measuredAt: Date;
  measurementMethod?: 'scale' | 'BIA' | 'DEXA' | 'skinfold' | 'manual';
  notes?: string;

  // Flags
  isCurrent: boolean; // Only one record per user should be true

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

const BodyCompositionSchema = new Schema<IBodyComposition>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Core Measurements
  weight: {
    type: Number,
    required: [true, 'Weight is required'],
    min: [30, 'Weight must be at least 30 kg'],
    max: [300, 'Weight must not exceed 300 kg']
  },
  bodyFatPercentage: {
    type: Number,
    min: [5, 'Body fat percentage must be at least 5%'],
    max: [50, 'Body fat percentage must not exceed 50%'],
    default: null
  },
  leanBodyMass: {
    type: Number,
    min: [20, 'Lean body mass must be at least 20 kg'],
    max: [200, 'Lean body mass must not exceed 200 kg'],
    default: null
  },

  // Measurement Details
  measuredAt: {
    type: Date,
    required: true,
    default: Date.now
  },
  measurementMethod: {
    type: String,
    enum: ['scale', 'BIA', 'DEXA', 'skinfold', 'manual'],
    default: 'manual'
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },

  // Flags
  isCurrent: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes for efficient queries
BodyCompositionSchema.index({ userId: 1, measuredAt: -1 });
BodyCompositionSchema.index({ userId: 1, isCurrent: 1 });
BodyCompositionSchema.index({ createdAt: -1 });

// Pre-save middleware to calculate lean body mass
BodyCompositionSchema.pre('save', function(next) {
  // Auto-calculate lean body mass if body fat percentage is provided
  if (this.isModified('weight') || this.isModified('bodyFatPercentage')) {
    if (this.bodyFatPercentage && this.weight) {
      const fatMass = this.weight * (this.bodyFatPercentage / 100);
      this.leanBodyMass = this.weight - fatMass;
    } else {
      this.leanBodyMass = undefined;
    }
  }

  next();
});

// Pre-save middleware to normalize measuredAt to date-only (no time component)
BodyCompositionSchema.pre('save', function(next) {
  if (this.isModified('measuredAt') && this.measuredAt) {
    const date = new Date(this.measuredAt);
    date.setUTCHours(0, 0, 0, 0);
    this.measuredAt = date;
  }
  next();
});

// Static method: Get current body composition for a user
BodyCompositionSchema.statics.getCurrentComposition = function(userId: string) {
  return this.findOne({ userId, isCurrent: true });
};

// Static method: Get recent history for a user
BodyCompositionSchema.statics.getHistory = function(
  userId: string,
  limit: number = 30
) {
  return this.find({ userId })
    .sort({ measuredAt: -1 })
    .limit(limit);
};

// Static method: Get composition at a specific date
BodyCompositionSchema.statics.getCompositionAtDate = function(
  userId: string,
  date: Date
) {
  return this.findOne({
    userId,
    measuredAt: { $lte: date }
  }).sort({ measuredAt: -1 });
};

// Static method: Create new composition and mark as current
BodyCompositionSchema.statics.createCurrent = async function(
  userId: string,
  data: Partial<IBodyComposition>
) {
  // Unmark all previous records as non-current
  await this.updateMany(
    { userId, isCurrent: true },
    { $set: { isCurrent: false } }
  );

  // Create new record as current
  return this.create({
    ...data,
    userId,
    isCurrent: true,
    measuredAt: data.measuredAt || new Date()
  });
};

// Instance method to calculate BMI
BodyCompositionSchema.methods.calculateBMI = function(height: number): number {
  // BMI = weight (kg) / (height (m))^2
  const heightInMeters = height / 100;
  return this.weight / (heightInMeters * heightInMeters);
};

// Instance method to calculate fat mass
BodyCompositionSchema.methods.getFatMass = function(): number | null {
  if (!this.bodyFatPercentage) return null;
  return this.weight * (this.bodyFatPercentage / 100);
};

export default (mongoose.models.BodyComposition ||
  mongoose.model<IBodyComposition, IBodyCompositionModel>('BodyComposition', BodyCompositionSchema)) as unknown as IBodyCompositionModel;
