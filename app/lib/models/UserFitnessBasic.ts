import mongoose, { Document, Schema } from 'mongoose';

/**
 * User Fitness Basic - Essential Fitness Data
 * This collection stores basic fitness information for each user
 */

export interface IUserFitnessBasic extends Document {
  _id: string;
  userId: mongoose.Types.ObjectId; // Reference to User

  // Body Metrics
  height: number; // cm
  weight: number; // kg

  // Training Info
  trainingLevel: 'beginner' | 'intermediate' | 'advanced' | 'elite';
  activityLevel: 'sedentary' | 'lightlyActive' | 'moderatelyActive' | 'veryActive' | 'extraActive';
  firstTrainingYear: number; // Year user started training (e.g., 2020)

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

const UserFitnessBasicSchema = new Schema<IUserFitnessBasic>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true // One fitness profile per user
  },

  // Body Metrics
  height: {
    type: Number,
    required: [true, 'Height is required'],
    min: [120, 'Height must be at least 120 cm'],
    max: [250, 'Height must not exceed 250 cm']
  },
  weight: {
    type: Number,
    required: [true, 'Weight is required'],
    min: [30, 'Weight must be at least 30 kg'],
    max: [300, 'Weight must not exceed 300 kg']
  },

  // Training Info
  trainingLevel: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'elite'],
    required: [true, 'Training level is required']
  },
  activityLevel: {
    type: String,
    enum: ['sedentary', 'lightlyActive', 'moderatelyActive', 'veryActive', 'extraActive'],
    required: [true, 'Activity level is required']
  },
  firstTrainingYear: {
    type: Number,
    required: [true, 'First training year is required'],
    validate: {
      validator: function(value: number) {
        const currentYear = new Date().getFullYear();
        return value >= 1950 && value <= currentYear;
      },
      message: 'Invalid training start year'
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
UserFitnessBasicSchema.index({ createdAt: -1 });

// Virtual: Calculate training years from firstTrainingYear
UserFitnessBasicSchema.virtual('trainingYears').get(function() {
  const currentYear = new Date().getFullYear();
  return Math.max(0, currentYear - this.firstTrainingYear);
});

// Virtual: Calculate BMI
UserFitnessBasicSchema.virtual('bmi').get(function() {
  const heightInMeters = this.height / 100;
  return Number((this.weight / (heightInMeters * heightInMeters)).toFixed(1));
});

// Static method to find profile by userId
UserFitnessBasicSchema.statics.findByUserId = function(userId: string) {
  return this.findOne({ userId });
};

export default mongoose.models.UserFitnessBasic ||
  mongoose.model<IUserFitnessBasic>('UserFitnessBasic', UserFitnessBasicSchema);
