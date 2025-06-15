const mongoose = require('mongoose');

const PhaseSchema = new mongoose.Schema({
  name: {
    type: String,
    enum: ['planning', 'self', 'peer', 'manager', 'upward', 'calibration', 'completed'],
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  reminderDates: {
    type: [Date]
  },
  instructions: {
    type: String
  },
  isComplete: {
    type: Boolean,
    default: false
  }
});

const ReviewCycleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['planning', 'self', 'peer', 'manager', 'upward', 'calibration', 'completed'],
    default: 'planning'
  },
  phases: [PhaseSchema],
  currentPhase: {
    type: String,
    enum: ['planning', 'self', 'peer', 'manager', 'upward', 'calibration', 'completed'],
    default: 'planning'
  },
  cycleType: {
    type: String,
    enum: ['quarterly', 'half-yearly', 'annual', 'custom'],
    default: 'custom'
  },
  reviewTypes: {
    self: { type: Boolean, default: true },
    peer: { type: Boolean, default: true },
    manager: { type: Boolean, default: true },
    upward: { type: Boolean, default: false }
  },
  anonymitySettings: {
    peerReviews: {
      type: String,
      enum: ['full', 'partial', 'none'],
      default: 'full'
    },
    upwardReviews: {
      type: String,
      enum: ['full', 'partial', 'none'],
      default: 'full'
    }
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  templateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ReviewTemplate'
  },
  reminderSettings: {
    enabled: { type: Boolean, default: true },
    frequency: { type: Number, default: 3 }, // days
    escalateToManager: { type: Boolean, default: true },
    escalationDelay: { type: Number, default: 7 } // days
  },
  recurrence: {
    isRecurring: { type: Boolean, default: false },
    frequency: { 
      type: String, 
      enum: ['quarterly', 'half-yearly', 'annual'],
      default: 'annual'
    }
  },
  requireApproval: {
    type: Boolean,
    default: true
  },
  autoAdvancePhases: {
    type: Boolean, 
    default: false
  }
}, { timestamps: true });

ReviewCycleSchema.methods.getCurrentPhaseObject = function() {
  return this.phases.find(phase => phase.name === this.currentPhase);
};

ReviewCycleSchema.methods.isCurrentPhaseOverdue = function() {
  const currentPhase = this.getCurrentPhaseObject();
  if (!currentPhase) return false;
  
  return new Date() > new Date(currentPhase.endDate);
};

ReviewCycleSchema.methods.advanceToNextPhase = function() {
  const phaseOrder = ['planning', 'self', 'peer', 'manager', 'upward', 'calibration', 'completed'];
  const currentIdx = phaseOrder.indexOf(this.currentPhase);
  
  const currentPhase = this.phases.find(p => p.name === this.currentPhase);
  if (currentPhase) {
    currentPhase.isComplete = true;
  }
  
  if (currentIdx < phaseOrder.length - 1) {
    this.currentPhase = phaseOrder[currentIdx + 1];
    return true;
  }
  
  return false;
};

module.exports = mongoose.model('ReviewCycle', ReviewCycleSchema);
