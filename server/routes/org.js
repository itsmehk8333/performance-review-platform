const express = require('express');
const router = express.Router();
const { auth, adminOnly, managerAndAbove } = require('../middleware/auth');
const User = require('../models/User');
const ReviewAssignmentService = require('../services/ReviewAssignmentService');
const WorkflowService = require('../services/WorkflowService');
const ApprovalService = require('../services/ApprovalService');

// @route   GET api/org/direct-reports
// @desc    Get direct reports for the current user
// @access  Private
router.get('/direct-reports', auth, async (req, res) => {
  try {
    const directReports = await User.getDirectReports(req.user.id);
    res.json(directReports);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/org/all-reports
// @desc    Get all reports (direct and indirect) for the current user
// @access  Private
router.get('/all-reports', auth, async (req, res) => {
  try {
    const allReports = await User.getAllReports(req.user.id);
    res.json(allReports);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT api/org/update-manager/:userId
// @desc    Update a user's manager
// @access  Private - Admin only
router.put('/update-manager/:userId', adminOnly, async (req, res) => {
  try {
    const { managerId } = req.body;
    
    // Check if user exists
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    // Check if managerId is valid
    if (managerId) {
      const manager = await User.findById(managerId);
      if (!manager) {
        return res.status(404).json({ msg: 'Manager not found' });
      }
      
      // Prevent circular management relationships
      if (managerId === req.params.userId) {
        return res.status(400).json({ msg: 'A user cannot be their own manager' });
      }
    }
    
    // Update the user's manager
    user.managerId = managerId || null;
    await user.save();
    
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT api/org/update-department/:userId
// @desc    Update a user's department
// @access  Private - Admin only
router.put('/update-department/:userId', adminOnly, async (req, res) => {
  try {
    const { department } = req.body;
    
    // Check if user exists
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    // Update the user's department
    user.department = department || '';
    await user.save();
    
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT api/org/bulk-update
// @desc    Bulk update user org data (for imports)
// @access  Private - Admin only
router.put('/bulk-update', adminOnly, async (req, res) => {
  try {
    const { updates } = req.body;
    
    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ msg: 'Invalid updates format' });
    }
    
    const results = [];
    
    for (const update of updates) {
      const { userId, managerId, department, title, team } = update;
      
      if (!userId) {
        results.push({ success: false, msg: 'User ID is required', update });
        continue;
      }
      
      try {
        // Find the user
        const user = await User.findById(userId);
        if (!user) {
          results.push({ success: false, msg: 'User not found', update });
          continue;
        }
        
        // Update fields if provided
        if (managerId !== undefined) {
          // Verify manager exists if ID provided
          if (managerId) {
            const manager = await User.findById(managerId);
            if (!manager) {
              results.push({ success: false, msg: 'Manager not found', update });
              continue;
            }
          }
          user.managerId = managerId || null;
        }
        
        if (department !== undefined) user.department = department;
        if (title !== undefined) user.title = title;
        if (team !== undefined) user.team = team;
        
        await user.save();
        results.push({ success: true, user });
      } catch (err) {
        console.error(err.message);
        results.push({ success: false, msg: err.message, update });
      }
    }
    
    res.json(results);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/org/import-csv
// @desc    Import org chart from CSV
// @access  Private - Admin only
router.post('/import-csv', adminOnly, async (req, res) => {
  try {
    // This would typically use a file upload middleware
    // For now, we'll assume the CSV data is in the request body
    const { csvData } = req.body;
    
    if (!csvData) {
      return res.status(400).json({ msg: 'CSV data is required' });
    }
    
    // Process CSV data and update users
    // This is a placeholder for actual CSV processing logic
    res.json({ msg: 'CSV import successful' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/org/org-chart
// @desc    Get full org chart
// @access  Private - Admin only
router.get('/org-chart', adminOnly, async (req, res) => {
  try {
    // Get all users with their manager IDs
    const users = await User.find().select('name email managerId department title team');
    
    // Build the org chart
    const orgChart = buildOrgChart(users);
    
    res.json(orgChart);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Helper function to build org chart
function buildOrgChart(users) {
  const userMap = {};
  const rootNodes = [];
  
  // First pass: create a map of users
  users.forEach(user => {
    userMap[user._id] = {
      _id: user._id,
      name: user.name,
      email: user.email,
      department: user.department,
      title: user.title,
      team: user.team,
      directReports: []
    };
  });
  
  // Second pass: build the tree
  users.forEach(user => {
    if (user.managerId && userMap[user.managerId]) {
      // Add user to their manager's direct reports
      userMap[user.managerId].directReports.push(userMap[user._id]);
    } else {
      // No manager or manager not found, this is a root node
      rootNodes.push(userMap[user._id]);
    }
  });
  
  return rootNodes;
}

module.exports = router;
