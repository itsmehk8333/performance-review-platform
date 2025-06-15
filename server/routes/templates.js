const express = require('express');
const router = express.Router();
const ReviewTemplate = require('../models/ReviewTemplate');
const { adminOnly, managerAndAbove } = require('../middleware/auth');

// @route   POST api/templates
// @desc    Create a new review template
// @access  Private - Manager or Admin only
router.post('/', managerAndAbove, async (req, res) => {
  try {
    const { name, description, questions, isDefault, applicableRoles } = req.body;
    
    // Create new review template
    const newTemplate = new ReviewTemplate({
      name,
      description,
      questions,
      isDefault,
      applicableRoles,
      createdBy: req.user.id
    });
    
    const template = await newTemplate.save();
    
    res.json(template);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/templates
// @desc    Get all review templates
// @access  Private
router.get('/', async (req, res) => {
  try {
    const templates = await ReviewTemplate.find()
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });
    
    res.json(templates);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/templates/:id
// @desc    Get review template by ID
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const template = await ReviewTemplate.findById(req.params.id)
      .populate('createdBy', 'name');
    
    if (!template) {
      return res.status(404).json({ msg: 'Template not found' });
    }
    
    res.json(template);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Template not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   PUT api/templates/:id
// @desc    Update a review template
// @access  Private - Manager or Admin only
router.put('/:id', managerAndAbove, async (req, res) => {
  try {
    const { name, description, questions, isDefault, applicableRoles } = req.body;
    
    // Find and update template
    const template = await ReviewTemplate.findById(req.params.id);
    
    if (!template) {
      return res.status(404).json({ msg: 'Template not found' });
    }
    
    // Update fields
    template.name = name || template.name;
    template.description = description || template.description;
    if (questions) template.questions = questions;
    if (isDefault !== undefined) template.isDefault = isDefault;
    if (applicableRoles) template.applicableRoles = applicableRoles;
    
    await template.save();
    
    res.json(template);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Template not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   DELETE api/templates/:id
// @desc    Delete a review template
// @access  Private - Manager or Admin only
router.delete('/:id', managerAndAbove, async (req, res) => {
  try {
    const template = await ReviewTemplate.findById(req.params.id);
    
    if (!template) {
      return res.status(404).json({ msg: 'Template not found' });
    }
    
    await template.remove();
    
    res.json({ msg: 'Template removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Template not found' });
    }
    res.status(500).send('Server error');
  }
});

module.exports = router;
