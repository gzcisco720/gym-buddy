import mongoose, { Document, Schema } from 'mongoose';

// Trainer-Member Relationship Interface
export interface ITrainerMemberRelation extends Document {
  _id: string;
  trainerId: mongoose.Types.ObjectId;
  memberId: mongoose.Types.ObjectId;
  assignedAt: Date;
  assignedBy: mongoose.Types.ObjectId; // Who assigned this relationship (admin/super_admin)
  isActive: boolean;
  notes?: string; // Optional notes about the assignment
  endedAt?: Date;
  endedBy?: mongoose.Types.ObjectId;
  endReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Trainer-Member Relationship Schema
const TrainerMemberRelationSchema = new Schema<ITrainerMemberRelation>({
  trainerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Trainer ID is required'],
    validate: {
      validator: async function(value: mongoose.Types.ObjectId) {
        const User = mongoose.model('User');
        const trainer = await User.findById(value);
        return trainer && trainer.role === 'TRAINER' && trainer.isActive;
      },
      message: 'Invalid trainer ID or trainer is not active'
    }
  },
  memberId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Member ID is required'],
    validate: {
      validator: async function(value: mongoose.Types.ObjectId) {
        const User = mongoose.model('User');
        const member = await User.findById(value);
        return member && member.role === 'MEMBER' && member.isActive;
      },
      message: 'Invalid member ID or member is not active'
    }
  },
  assignedAt: {
    type: Date,
    default: Date.now,
    required: true
  },
  assignedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Assigned by user ID is required']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters'],
    trim: true
  },
  endedAt: {
    type: Date,
    default: null
  },
  endedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  endReason: {
    type: String,
    enum: ['TRAINER_CHANGE', 'MEMBER_LEFT', 'ADMIN_DECISION', 'TRAINER_UNAVAILABLE', 'OTHER'],
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes for better query performance
TrainerMemberRelationSchema.index({ trainerId: 1, isActive: 1 });
TrainerMemberRelationSchema.index({ memberId: 1, isActive: 1 });
TrainerMemberRelationSchema.index({ trainerId: 1, memberId: 1 }, { unique: true });
TrainerMemberRelationSchema.index({ assignedAt: -1 });

// Populate virtuals
TrainerMemberRelationSchema.virtual('trainer', {
  ref: 'User',
  localField: 'trainerId',
  foreignField: '_id',
  justOne: true
});

TrainerMemberRelationSchema.virtual('member', {
  ref: 'User',
  localField: 'memberId',
  foreignField: '_id',
  justOne: true
});

TrainerMemberRelationSchema.virtual('assignedByUser', {
  ref: 'User',
  localField: 'assignedBy',
  foreignField: '_id',
  justOne: true
});

// Pre-save middleware to validate relationship
TrainerMemberRelationSchema.pre('save', async function(next) {
  try {
    // Check if member is already assigned to another active trainer
    if (this.isNew && this.isActive) {
      const existingRelation = await mongoose.model('TrainerMemberRelation')
        .findOne({
          memberId: this.memberId,
          isActive: true,
          _id: { $ne: this._id }
        });

      if (existingRelation) {
        throw new Error('Member is already assigned to another trainer');
      }
    }

    // If ending a relationship, set endedAt
    if (!this.isActive && !this.endedAt) {
      this.endedAt = new Date();
    }

    next();
  } catch (error) {
    next(error as Error);
  }
});

// Static methods
TrainerMemberRelationSchema.statics.findActiveByTrainer = function(trainerId: string) {
  return this.find({ trainerId, isActive: true })
    .populate('member', 'name email phone fitnessProfile')
    .sort({ assignedAt: -1 });
};

TrainerMemberRelationSchema.statics.findActiveByMember = function(memberId: string) {
  return this.findOne({ memberId, isActive: true })
    .populate('trainer', 'name email phone');
};

TrainerMemberRelationSchema.statics.assignMemberToTrainer = async function(
  memberId: string,
  trainerId: string,
  assignedBy: string,
  notes?: string
) {
  // End any existing active relationship for this member
  await this.updateMany(
    { memberId, isActive: true },
    {
      isActive: false,
      endedAt: new Date(),
      endedBy: assignedBy,
      endReason: 'TRAINER_CHANGE'
    }
  );

  // Create new relationship
  const newRelation = new this({
    trainerId,
    memberId,
    assignedBy,
    notes,
    isActive: true
  });

  return await newRelation.save();
};

TrainerMemberRelationSchema.statics.endRelationship = async function(
  relationId: string,
  endedBy: string,
  endReason: string
) {
  return await this.findByIdAndUpdate(
    relationId,
    {
      isActive: false,
      endedAt: new Date(),
      endedBy,
      endReason
    },
    { new: true }
  );
};

// Export the model
export default mongoose.models.TrainerMemberRelation ||
  mongoose.model<ITrainerMemberRelation>('TrainerMemberRelation', TrainerMemberRelationSchema);