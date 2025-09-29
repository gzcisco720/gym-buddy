import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

// User Role Enum
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  TRAINER = 'TRAINER',
  MEMBER = 'MEMBER',
  GYM_ADMIN = 'GYM_ADMIN' // Future implementation
}

// User Interface
export interface IUser extends Document {
  _id: string;
  name: string;
  email: string;
  password?: string; // Optional for OAuth users
  avatar?: string;
  role: UserRole;
  isActive: boolean;
  isEmailVerified: boolean;

  // Relationship fields
  trainerId?: mongoose.Types.ObjectId; // For MEMBER role - assigned trainer
  gymId?: mongoose.Types.ObjectId; // Future: gym association

  // Profile information
  phone?: string;
  dateOfBirth?: Date;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };

  // Fitness specific fields for MEMBER role
  fitnessProfile?: {
    height?: number; // in cm
    weight?: number; // in kg
    fitnessGoals?: string[];
    medicalConditions?: string[];
    fitnessLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  };

  // OAuth provider information
  providers?: {
    google?: {
      id: string;
      verified: boolean;
    };
    github?: {
      id: string;
      verified: boolean;
    };
  };

  // Timestamps
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;

  // Methods
  comparePassword(candidatePassword: string): Promise<boolean>;
  toPublicJSON(): Partial<IUser>;
}

// User Schema
const UserSchema = new Schema<IUser>({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't include in queries by default
  },
  avatar: {
    type: String,
    default: null
  },
  role: {
    type: String,
    enum: Object.values(UserRole),
    default: UserRole.MEMBER,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },

  // Relationships
  trainerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    validate: {
      validator: function(this: IUser, value: any) {
        // Only MEMBER role can have a trainerId
        return this.role !== UserRole.MEMBER || value != null;
      },
      message: 'Members must be assigned to a trainer'
    }
  },
  gymId: {
    type: Schema.Types.ObjectId,
    ref: 'Gym', // Future implementation
    default: null
  },

  // Contact information
  phone: {
    type: String,
    trim: true,
    match: [/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number']
  },
  dateOfBirth: {
    type: Date,
    validate: {
      validator: function(value: Date) {
        const today = new Date();
        const age = today.getFullYear() - value.getFullYear();
        return age >= 13 && age <= 120; // Age restrictions
      },
      message: 'Invalid date of birth'
    }
  },
  emergencyContact: {
    name: { type: String, trim: true },
    phone: { type: String, trim: true },
    relationship: { type: String, trim: true }
  },

  // Fitness profile for members
  fitnessProfile: {
    height: {
      type: Number,
      min: [50, 'Height must be at least 50cm'],
      max: [300, 'Height cannot exceed 300cm']
    },
    weight: {
      type: Number,
      min: [20, 'Weight must be at least 20kg'],
      max: [500, 'Weight cannot exceed 500kg']
    },
    fitnessGoals: [{
      type: String,
      enum: ['WEIGHT_LOSS', 'MUSCLE_GAIN', 'STRENGTH', 'ENDURANCE', 'FLEXIBILITY', 'GENERAL_FITNESS']
    }],
    medicalConditions: [String],
    fitnessLevel: {
      type: String,
      enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'],
      default: 'BEGINNER'
    }
  },

  // OAuth providers
  providers: {
    google: {
      id: String,
      verified: { type: Boolean, default: false }
    },
    github: {
      id: String,
      verified: { type: Boolean, default: false }
    }
  },

  lastLoginAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
// Note: email index is already created via unique: true in schema
UserSchema.index({ role: 1 });
UserSchema.index({ trainerId: 1 });
UserSchema.index({ isActive: 1 });
UserSchema.index({ createdAt: -1 });

// Pre-save middleware to hash password
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) return next();

  try {
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
    this.password = await bcrypt.hash(this.password, saltRounds);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Instance method to compare password
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// Instance method to return public user data
UserSchema.methods.toPublicJSON = function(): Partial<IUser> {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.__v;
  return userObject;
};

// Virtual for member's assigned trainer
UserSchema.virtual('assignedTrainer', {
  ref: 'User',
  localField: 'trainerId',
  foreignField: '_id',
  justOne: true
});

// Virtual for trainer's members
UserSchema.virtual('members', {
  ref: 'User',
  localField: '_id',
  foreignField: 'trainerId'
});

// Static methods
UserSchema.statics.findByEmail = function(email: string) {
  return this.findOne({ email: email.toLowerCase() });
};

UserSchema.statics.findActiveUsers = function() {
  return this.find({ isActive: true });
};

UserSchema.statics.findByRole = function(role: UserRole) {
  return this.find({ role, isActive: true });
};

// Export the model
export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);