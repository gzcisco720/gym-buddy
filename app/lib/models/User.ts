import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

// User Role Enum
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  USER = 'USER',
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
  registrationCompleted: boolean; // Track if OAuth user completed registration

  // Basic profile information
  phone?: string;
  gender?: 'male' | 'female';
  dateOfBirth?: Date;

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
    default: UserRole.USER,
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
  registrationCompleted: {
    type: Boolean,
    default: true // Default true for credential signups, false for OAuth
  },

  // Basic profile information
  phone: {
    type: String,
    trim: true,
    // Australian phone number validation: supports +61 4XX XXX XXX or 04XX XXX XXX (mobile) and +61 X XXXX XXXX or 0X XXXX XXXX (landline)
    match: [/^(?:\+?61|0)(?:[2-478]\d{8}|4\d{8})$/, 'Please enter a valid Australian phone number']
  },
  gender: {
    type: String,
    enum: ['male', 'female']
  },
  dateOfBirth: {
    type: Date
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