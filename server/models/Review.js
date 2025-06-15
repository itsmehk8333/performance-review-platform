const mongoose = require('mongoose');

const AnswerSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  type: {
    type: String,
    enum: ['rating', 'open-ended', 'multiple-choice'],
    required: true
  },
  ratingValue: {
    type: Number
  },
  textValue: {
    type: String
  },
  selectedOptions: {
    type: [String]
  },
  // Sentiment analysis fields for each answer
  sentimentScore: {
    type: Number
  },
  sentimentLabel: {
    type: String,
    enum: ['positive', 'neutral', 'negative']
  },  vaguenessFlags: {
    type: [String]
  },
  vagueWords: {
    type: [String]
  }
});

const ReviewSchema = new mongoose.Schema({
  cycleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ReviewCycle',
    required: true
  },
  templateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ReviewTemplate',
    required: true
  },
  reviewer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reviewee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['self', 'peer', 'manager', 'upward'],
    required: true
  },
  // Legacy field for backward compatibility
  content: {
    type: String,
    default: ''
  },
  // Legacy field for backward compatibility
  ratings: {
    type: Map,
    of: Number,
    default: {}
  },
  // New structured response format
  answers: [AnswerSchema],
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'submitted', 'approved', 'rejected', 'calibrated'],
    default: 'pending'
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  visibleToReviewee: {
    type: Boolean,
    default: true
  },
  submittedAt: {
    type: Date
  },
  // Approval system fields
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  },
  rejectionReason: {
    type: String
  },
  // Notification and reminder fields
  lastReminderSent: {
    type: Date
  },
  reminderCount: {
    type: Number,
    default: 0
  },
  // Overall sentiment analysis fields
  overallSentimentScore: {
    type: Number
  },
  overallSentimentLabel: {
    type: String,
    enum: ['positive', 'neutral', 'negative']
  },  overallVaguenessFlags: {
    type: [String]
  },
  vagueWords: {
    type: [String]
  },
  calibrationNotes: {
    type: String
  },
  overallRating: {
    type: Number
  },
  summaryFeedback: {
    type: String
  }
}, { timestamps: true });

module.exports = mongoose.model('Review', ReviewSchema);
