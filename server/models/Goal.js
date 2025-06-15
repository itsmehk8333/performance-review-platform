const mongoose = require('mongoose');

const GoalSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  level: {
    type: String,
    enum: ['company', 'department', 'team', 'individual'],
    default: 'individual',
    required: true
  },
  parentGoal: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Goal',
    default: null
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  dueDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['In Progress', 'Completed'],
    default: 'In Progress'
  },  completedAt: {
    type: Date
  },
  tags: {
    type: [String],
    default: []
  },
  comments: [{
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    text: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  updates: [{
    progress: {
      type: Number,
      required: true
    },
    note: {
      type: String
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, { timestamps: true });

// Pre-save hook to automatically set status to completed when progress is 100%
GoalSchema.pre('save', function(next) {
  if (this.progress === 100 && this.status !== 'Completed') {
    this.status = 'Completed';
    this.completedAt = new Date();
  }
  next();
});

module.exports = mongoose.model('Goal', GoalSchema);
