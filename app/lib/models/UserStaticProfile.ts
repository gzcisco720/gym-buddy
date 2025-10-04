import mongoose, { Document, Schema } from 'mongoose';

/**
 * User Static Profile - Immutable or Slowly Changing Data
 * This collection stores data that rarely changes after initial setup
 */

export interface IUserStaticProfile extends Document {
  _id: string;
  userId: mongoose.Types.ObjectId; // Reference to User

  // Immutable Data
  gender: 'male' | 'female';
  dateOfBirth: Date;
  height: number; // cm

  // Slowly Changing Data
  trainingLevel: 'beginner' | 'intermediate' | 'advanced' | 'elite';
  activityLevel: 'sedentary' | 'lightlyActive' | 'moderatelyActive' | 'veryActive' | 'extraActive';

  // Training History
  firstTrainingYear: number; // Year user started training (e.g., 2020)

  // Metadata
  profileCompletedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserStaticProfileSchema = new Schema<IUserStaticProfile>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true // One static profile per user
  },

  // Immutable Data
  gender: {
    type: String,
    enum: ['male', 'female'],
    required: [true, 'Gender is required']
  },
  dateOfBirth: {
    type: Date,
    required: [true, 'Date of birth is required'],
    validate: {
      validator: function(value: Date) {
        const today = new Date();
        const age = today.getFullYear() - value.getFullYear();
        return age >= 10 && age <= 100;
      },
      message: 'Age must be between 10 and 100 years'
    }
  },
  height: {
    type: Number,
    required: [true, 'Height is required'],
    min: [120, 'Height must be at least 120 cm'],
    max: [250, 'Height must not exceed 250 cm']
  },

  // Slowly Changing Data
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

  // Training History
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
  },

  profileCompletedAt: {
    type: Date,
    required: true,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
// Note: userId already has a unique index from the schema definition (line 35)
// No need to create another index here
UserStaticProfileSchema.index({ createdAt: -1 });

// Virtual: Calculate current age from dateOfBirth
UserStaticProfileSchema.virtual('age').get(function() {
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
});

// Virtual: Calculate training years from firstTrainingYear
UserStaticProfileSchema.virtual('trainingYears').get(function() {
  const currentYear = new Date().getFullYear();
  return Math.max(0, currentYear - this.firstTrainingYear);
});

// Pre-save middleware to normalize dateOfBirth to date-only (no time)
UserStaticProfileSchema.pre('save', function(next) {
  if (this.isModified('dateOfBirth') && this.dateOfBirth) {
    const date = new Date(this.dateOfBirth);
    date.setUTCHours(0, 0, 0, 0);
    this.dateOfBirth = date;
  }
  next();
});

// Static method to find profile by userId
UserStaticProfileSchema.statics.findByUserId = function(userId: string) {
  return this.findOne({ userId });
};

export default mongoose.models.UserStaticProfile ||
  mongoose.model<IUserStaticProfile>('UserStaticProfile', UserStaticProfileSchema);
