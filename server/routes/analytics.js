const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Feedback = require('../models/Feedback');
const { auth } = require('../middleware/auth');

// @route   GET api/analytics/review-volume
// @desc    Get review volume data by month
// @access  Private
router.get('/review-volume', auth, async (req, res) => {
  try {
    // Get date from 12 months ago
    const oneYearAgo = new Date();
    oneYearAgo.setMonth(oneYearAgo.getMonth() - 12);
    
    // Aggregate reviews by month
    const reviewVolume = await Review.aggregate([
      {
        $match: {
          createdAt: { $gte: oneYearAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          count: { $sum: 1 },
          submitted: {
            $sum: { $cond: [{ $eq: ["$status", "submitted"] }, 1, 0] }
          },
          pending: {
            $sum: { $cond: [{ $ne: ["$status", "submitted"] }, 1, 0] }
          }
        }
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 }
      }
    ]);
    
    // Fill in any missing months with zero values
    const filledData = fillMissingMonths(reviewVolume, oneYearAgo);
    
    res.json(filledData);
  } catch (err) {
    console.error('Error fetching review volume:', err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/analytics/feedback-frequency
// @desc    Get feedback frequency data by week
// @access  Private
router.get('/feedback-frequency', auth, async (req, res) => {
  try {
    // Get date from 12 months ago
    const oneYearAgo = new Date();
    oneYearAgo.setMonth(oneYearAgo.getMonth() - 12);
    
    // Aggregate feedback by week
    const feedbackFrequency = await Feedback.aggregate([
      {
        $match: {
          createdAt: { $gte: oneYearAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            week: { $week: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { "_id.year": 1, "_id.week": 1 }
      }
    ]);
    
    res.json(feedbackFrequency);
  } catch (err) {
    console.error('Error fetching feedback frequency:', err.message);
    res.status(500).send('Server Error');
  }
});

// Helper function to fill in missing months with zero values
function fillMissingMonths(data, startDate) {
  const result = [];
  const currentDate = new Date();
  
  // Create a map of existing data points
  const dataMap = {};
  data.forEach(item => {
    const key = `${item._id.year}-${item._id.month}`;
    dataMap[key] = item;
  });
  
  // Loop through each month in the range and add data or zeros
  for (let d = new Date(startDate); d <= currentDate; d.setMonth(d.getMonth() + 1)) {
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const key = `${year}-${month}`;
    
    if (dataMap[key]) {
      result.push(dataMap[key]);
    } else {
      result.push({
        _id: { year, month },
        count: 0,
        submitted: 0,
        pending: 0
      });
    }
  }
  
  return result;
}

module.exports = router;
