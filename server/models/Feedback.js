const mongoose = require('mongoose');

const FeedbackSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  goal: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Goal',
    required: true
  },  text: {
    type: String,
    required: true
  },
  tags: {
    skills: [String],
    values: [String],
    initiatives: [String]
  },
  sentiment: {
    score: {
      type: Number,
      min: -1,
      max: 1
    },
    label: {
      type: String,
      enum: ['positive', 'neutral', 'negative']
    }
  }
}, { timestamps: true });

module.exports = mongoose.model('Feedback', FeedbackSchema);
