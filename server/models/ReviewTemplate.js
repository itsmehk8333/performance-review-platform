const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['rating', 'open-ended', 'multiple-choice'],
    required: true
  },
  category: {
    type: String,
    enum: ['competency', 'goal', 'general'],
    default: 'general'
  },
  options: [{
    label: String,
    value: String
  }],
  ratingScale: {
    min: {
      type: Number,
      default: 1
    },
    max: {
      type: Number,
      default: 5
    },
    labels: {
      type: Map,
      of: String
    }
  },
  required: {
    type: Boolean,
    default: true
  },
  visibleTo: {
    type: [String],
    enum: ['self', 'peer', 'manager', 'upward', 'all'],
    default: ['all']
  }
});

const ReviewTemplateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  questions: [QuestionSchema],
  isDefault: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  applicableRoles: {
    type: [String],
    enum: ['Employee', 'Manager', 'Admin', 'All'],
    default: ['All']
  }
}, { timestamps: true });

module.exports = mongoose.model('ReviewTemplate', ReviewTemplateSchema);
