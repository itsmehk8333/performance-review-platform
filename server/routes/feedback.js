const express = require('express');
const router = express.Router();
const Feedback = require('../models/Feedback');
const Goal = require('../models/Goal');
const { managerOrAdminOnly, auth } = require('../middleware/auth');
const { Parser } = require('json2csv');
const PDFDocument = require('pdfkit');

// OpenAI setup for sentiment analysis
const OpenAI = require('openai');
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// @route   POST api/feedback
// @desc    Create feedback
// @access  Private
router.post('/', async (req, res) => {
  try {
    const { goalId, text, tags } = req.body;
    
    // Validate goal exists
    const goal = await Goal.findById(goalId);
    if (!goal) {
      return res.status(404).json({ msg: 'Goal not found' });
    }
    
    // Create new feedback
    const newFeedback = new Feedback({
      author: req.user.id,
      goal: goalId,
      text,
      tags: tags || {} // Initialize tags if provided, otherwise empty object
    });
      // Analyze sentiment using OpenAI
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are an AI that analyzes sentiment." },
          { role: "user", content: `Analyze the sentiment of this feedback. Return only a number between -1 (very negative) and 1 (very positive):\n\n"${text}"` }
        ],
        max_tokens: 5,
        temperature: 0.3,
      });
      
      const sentimentScore = parseFloat(response.choices[0].message.content.trim());
      
      // Determine sentiment label
      let sentimentLabel;
      if (sentimentScore >= 0.3) {
        sentimentLabel = 'positive';
      } else if (sentimentScore <= -0.3) {
        sentimentLabel = 'negative';
      } else {
        sentimentLabel = 'neutral';
      }
      
      newFeedback.sentiment = {
        score: sentimentScore,
        label: sentimentLabel
      };    } catch (error) {
      console.error('Error analyzing sentiment:', error.message || error);
      // If OpenAI fails, set a neutral sentiment as fallback
      newFeedback.sentiment = {
        score: 0,
        label: 'neutral'
      };
    }
    
    const feedback = await newFeedback.save();
    
    await feedback.populate('author', 'name email');
    await feedback.populate('goal', 'title');
    
    res.json(feedback);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/feedback
// @desc    Get all feedback with optional filters
// @access  Private
router.get('/', async (req, res) => {
  try {
    const { goalId } = req.query;
    
    // Build filter object
    const filter = {};
    
    if (goalId) {
      filter.goal = goalId;
    }
    
    const feedback = await Feedback.find(filter)
      .populate('author', 'name email')
      .populate('goal', 'title level')
      .sort({ createdAt: -1 });
    
    res.json(feedback);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/feedback/export
// @desc    Export feedback as CSV or PDF
// @access  Private - Managers or Admin only
router.get('/export', auth, async (req, res) => {
  try {
    // Check if user and user.role exist
    if (!req.user) {
      console.log('Auth failed in feedback export: No user in request');
      return res.status(403).json({ msg: 'Authentication required' });
    }
    
    console.log('User object in feedback export:', JSON.stringify(req.user));
    
    if (!req.user.role) {
      console.log('Auth failed in feedback export: User has no role property');
      // Try to re-fetch the user with role populated
      const User = require('../models/User'); // Make sure User model is available
      const fullUser = await User.findById(req.user._id || req.user.id).populate('role');
      if (!fullUser || !fullUser.role) {
        return res.status(403).json({ msg: 'User role information not available' });
      }
      // Use the fetched user's role
      req.user = fullUser;
    }
    
    // Now check the role
    const roleName = typeof req.user.role === 'object' ? req.user.role.name : req.user.role;
    console.log('User role determined to be:', roleName);
    
    if (roleName !== 'Manager' && roleName !== 'Admin') {
      console.log(`Auth failed in feedback export: User role ${roleName} is not Manager or Admin`);
      return res.status(403).json({ msg: 'Access denied: Manager or Admin only' });
    }
    
    console.log('Feedback export access granted to:', req.user._id || req.user.id, 'with role:', roleName);
    
    const { format, userId } = req.query;
      // Build query
    const query = {};
    if (userId) {
      query.author = userId;
    }
    
    // Get feedback data
    const feedback = await Feedback.find(query)
      .populate('author', 'name email')
      .populate('goal', 'title')
      .sort({ createdAt: -1 });
      if (format === 'csv') {
      // Generate CSV
      const fields = ['Author', 'Goal', 'Content', 'Sentiment', 'Date'];
      const data = feedback.map(item => ({
        'Author': item.author ? (item.author.name || 'Unknown') : 'Unknown',
        'Goal': item.goal ? (item.goal.title || 'General Feedback') : 'General Feedback',
        'Content': item.text || '',
        'Sentiment': item.sentiment?.label || 'N/A',
        'Date': new Date(item.createdAt).toLocaleDateString()
      }));
      
      const json2csvParser = new Parser({ fields });
      const csv = json2csvParser.parse(data);
      
      res.header('Content-Type', 'text/csv');
      res.attachment('feedback-export.csv');
      return res.send(csv);
    } else if (format === 'pdf') {
      // Generate PDF
      const doc = new PDFDocument();
      
      // Set response headers
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=feedback-export.pdf');
      
      // Pipe PDF to response
      doc.pipe(res);
      
      // Add content to PDF
      doc.fontSize(20).text('Feedback Export', { align: 'center' });
      doc.moveDown();
        feedback.forEach((item, index) => {
        doc.fontSize(14).text(`Feedback #${index + 1}`);
        doc.fontSize(12).text(`Author: ${item.author ? `${item.author.name} (${item.author.email})` : 'Unknown'}`);
        if (item.goal) {
          doc.fontSize(12).text(`Goal: ${item.goal.title}`);
        }
        doc.fontSize(12).text(`Date: ${new Date(item.createdAt).toLocaleDateString()}`);
        doc.fontSize(12).text(`Sentiment: ${item.sentiment?.label || 'N/A'}`);
        doc.moveDown();
        doc.fontSize(12).text('Content:');
        doc.fontSize(10).text(item.text || '');
        doc.moveDown();
        
        if (index < feedback.length - 1) {
          doc.moveDown();
          doc.strokeColor('#aaaaaa').lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
          doc.moveDown();
        }
      });
      
      // Finalize PDF
      doc.end();
    } else {
      return res.status(400).json({ msg: 'Invalid export format. Use csv or pdf.' });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/feedback/tags
// @desc    Get predefined tags for feedback
// @access  Private
router.get('/tags', async (req, res) => {
  try {
    // These would typically come from a database, but for simplicity
    // we'll define them here directly
    const availableTags = {
      skills: [
        'Communication',
        'Technical',
        'Leadership',
        'Problem Solving',
        'Teamwork',
        'Time Management',
        'Creativity'
      ],
      values: [
        'Innovation',
        'Integrity',
        'Collaboration',
        'Excellence',
        'Customer Focus',
        'Accountability'
      ],
      initiatives: [
        'Digital Transformation',
        'Customer Experience',
        'Operational Excellence',
        'Product Development',
        'Sustainability'
      ]
    };
    
    res.json(availableTags);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
