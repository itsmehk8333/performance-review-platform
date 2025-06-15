const express = require('express');
const router = express.Router();
const Goal = require('../models/Goal');
const { adminOnly, managerOrAbove } = require('../middleware/auth');
const mongoose = require('mongoose');

// @route   POST api/goals
// @desc    Create a goal
// @access  Private
router.post('/', async (req, res) => {
  try {
    const { title, description, level, parentGoal, dueDate } = req.body;
    
    // Create new goal
    const newGoal = new Goal({
      title,
      description,
      owner: req.user.id,
      level,
      dueDate,
      parentGoal: parentGoal || null
    });

    // Check for correct permissions based on goal level
    if (level === 'company' && req.user.role.name !== 'Admin') {
      return res.status(403).json({ msg: 'Only admins can create company goals' });
    }
    
    if ((level === 'department' || level === 'team') && 
        (req.user.role.name !== 'Manager' && req.user.role.name !== 'Admin')) {
      return res.status(403).json({ msg: 'Only managers or admins can create department/team goals' });
    }

    const goal = await newGoal.save();
    
    res.json(goal);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/goals
// @desc    Get all goals with optional filters
// @access  Private
router.get('/', async (req, res) => {
  try {
    const { level, owner } = req.query;
    
    // Build filter object
    const filter = {};
    
    if (level) {
      filter.level = level;
    }
    
    if (owner) {
      filter.owner = owner;
    }
    
    // For employees, only show their goals and parent goals
    if (req.user.role.name === 'Employee') {
      // Find all goals owned by the user
      const ownGoals = await Goal.find({ owner: req.user.id });
      
      // Get all parent goal ids (all the way up the chain)
      let parentGoalIds = [];
      for (let goal of ownGoals) {
        if (goal.parentGoal) {
          parentGoalIds.push(goal.parentGoal);
          // Find parent's parent and so on
          let currentParentId = goal.parentGoal;
          let depth = 0; // Prevent infinite loops
          while (currentParentId && depth < 10) {
            const parentGoal = await Goal.findById(currentParentId);
            if (parentGoal && parentGoal.parentGoal) {
              parentGoalIds.push(parentGoal.parentGoal);
              currentParentId = parentGoal.parentGoal;
            } else {
              currentParentId = null;
            }
            depth++;
          }
        }
      }
      
      // Get all company and department/team goals
      const companyGoals = await Goal.find({ level: 'company' });
      const deptTeamGoals = await Goal.find({ 
        level: { $in: ['department', 'team'] } 
      });
      
      // Combine all goals employee can see
      const goalIds = [
        ...ownGoals.map(g => g._id),
        ...parentGoalIds,
        ...companyGoals.map(g => g._id),
        ...deptTeamGoals.map(g => g._id)
      ];
      
      filter._id = { $in: goalIds };
    }
    
    const goals = await Goal.find(filter)
      .populate('owner', 'name email')
      .populate('parentGoal', 'title level');
    
    res.json(goals);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/goals/:id
// @desc    Get goal by ID
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const goal = await Goal.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('parentGoal', 'title level');
    
    if (!goal) {
      return res.status(404).json({ msg: 'Goal not found' });
    }
    
    res.json(goal);
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Goal not found' });
    }
    
    res.status(500).send('Server error');
  }
});

// @route   PATCH api/goals/:id/progress
// @desc    Update goal progress
// @access  Private
router.patch('/:id/progress', async (req, res) => {
  try {
    const { progress, note } = req.body;
    
    if (progress < 0 || progress > 100) {
      return res.status(400).json({ msg: 'Progress must be between 0 and 100' });
    }
    
    const goal = await Goal.findById(req.params.id);
    
    if (!goal) {
      return res.status(404).json({ msg: 'Goal not found' });
    }
    
    // Check if user owns this goal or is a manager/admin
    if (!goal.owner.equals(req.user.id) && 
        req.user.role.name !== 'Manager' && 
        req.user.role.name !== 'Admin') {
      return res.status(403).json({ msg: 'Not authorized to update this goal' });
    }
    
    // Track the progress update
    const update = {
      progress,
      note: note || `Progress updated to ${progress}%`,
      updatedBy: req.user.id,
      updatedAt: new Date()
    };
    
    goal.updates.push(update);
    
    // Update goal progress
    goal.progress = progress;
    
    // If progress is 100%, automatically mark as completed
    if (progress === 100) {
      goal.status = 'Completed';
      goal.completedAt = new Date();
    }
    
    await goal.save();
    
    // Update parent goal progress if exists
    if (goal.parentGoal) {
      await updateParentGoalProgress(goal.parentGoal);
    }
    
    res.json(goal);
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Goal not found' });
    }
    
    res.status(500).send('Server error');
  }
});

// Function to update parent goal progress
async function updateParentGoalProgress(parentGoalId) {
  try {
    // Find all child goals
    const childGoals = await Goal.find({ parentGoal: parentGoalId });
    
    if (childGoals.length > 0) {
      // Calculate average progress
      const totalProgress = childGoals.reduce((sum, goal) => sum + goal.progress, 0);
      const avgProgress = Math.round(totalProgress / childGoals.length);
      
      // Update parent goal
      const parentGoal = await Goal.findById(parentGoalId);
      
      if (parentGoal) {
        parentGoal.progress = avgProgress;
        
        // If avg progress is 100%, mark as completed
        if (avgProgress === 100) {
          parentGoal.status = 'Completed';
          parentGoal.completedAt = new Date();
        }
        
        await parentGoal.save();
        
        // Recursively update higher-level parent goals
        if (parentGoal.parentGoal) {
          await updateParentGoalProgress(parentGoal.parentGoal);
        }
      }
    }
  } catch (err) {
    console.error('Error updating parent goal progress:', err);
  }
}

// @route   DELETE api/goals/:id
// @desc    Delete a goal
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const goal = await Goal.findById(req.params.id);
    
    if (!goal) {
      return res.status(404).json({ msg: 'Goal not found' });
    }
    
    // Check if user owns this goal or is admin
    if (!goal.owner.equals(req.user.id) && req.user.role.name !== 'Admin') {
      return res.status(403).json({ msg: 'Not authorized to delete this goal' });
    }
    
    // Check if this goal has children
    const childGoals = await Goal.find({ parentGoal: goal._id });
    
    if (childGoals.length > 0) {
      return res.status(400).json({ 
        msg: 'Cannot delete goal with sub-goals. Delete sub-goals first or reassign them.' 
      });
    }
    
    await goal.deleteOne();
    
    res.json({ msg: 'Goal removed' });
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Goal not found' });
    }
    
    res.status(500).send('Server error');
  }
});

// @route   PATCH api/goals/:id/tags
// @desc    Add tags to a goal
// @access  Private
router.patch('/:id/tags', async (req, res) => {
  try {
    const { tags } = req.body;
    
    if (!Array.isArray(tags)) {
      return res.status(400).json({ msg: 'Tags must be an array' });
    }
    
    const goal = await Goal.findById(req.params.id);
    
    if (!goal) {
      return res.status(404).json({ msg: 'Goal not found' });
    }
    
    // Check if user has permission to update this goal
    if (!goal.owner.equals(req.user.id) && 
        req.user.role.name !== 'Manager' && 
        req.user.role.name !== 'Admin') {
      return res.status(403).json({ msg: 'Not authorized to update this goal' });
    }
    
    // Add tags without duplicates
    const updatedTags = [...new Set([...goal.tags, ...tags])];
    goal.tags = updatedTags;
    
    await goal.save();
    
    res.json({ tags: goal.tags });
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Goal not found' });
    }
    
    res.status(500).send('Server error');
  }
});

// @route   POST api/goals/:id/comments
// @desc    Add a comment to a goal
// @access  Private
router.post('/:id/comments', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ msg: 'Text is required' });
    }
    
    const goal = await Goal.findById(req.params.id);
    
    if (!goal) {
      return res.status(404).json({ msg: 'Goal not found' });
    }
    
    // Add comment
    const comment = {
      author: req.user.id,
      text,
      createdAt: new Date()
    };
    
    goal.comments.push(comment);
    await goal.save();
    
    // Get the newly added comment with author details
    const populatedGoal = await Goal.findById(req.params.id)
      .populate('comments.author', 'name email');
    
    const newComment = populatedGoal.comments[populatedGoal.comments.length - 1];
    
    res.json(newComment);
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Goal not found' });
    }
    
    res.status(500).send('Server error');
  }
});

module.exports = router;
