const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { auth, adminOnly, managerOrAdminOnly } = require('../middleware/auth');

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if user exists
    const user = await User.findOne({ email }).populate('role');
    
    if (!user) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Return jsonwebtoken
    const payload = {
      id: user.id,
      role: user.role.name
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '1d' },
      (err, token) => {
        if (err) throw err;
        res.json({
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role.name
          }
        });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password').populate('role');
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/auth/users
// @desc    Get all users
// @access  Private - Admin or Manager only
router.get('/users', auth, async (req, res) => {
  try {
    // Check if user and user.role exist
    if (!req.user) {
      console.log('Auth failed in users list: No user in request');
      return res.status(403).json({ msg: 'Authentication required' });
    }
    
    console.log('User object:', JSON.stringify(req.user));
    
    if (!req.user.role) {
      console.log('Auth failed in users list: User has no role property');
      // Try to re-fetch the user with role populated
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
      console.log(`Auth failed in users list: User role ${roleName} is not Manager or Admin`);
      return res.status(403).json({ msg: 'Access denied: Manager or Admin only' });
    }
    
    console.log('Users list access granted to:', req.user._id || req.user.id, 'with role:', roleName);
    
    const users = await User.find().select('-password').populate('role');
    console.log(`Found ${users.length} users`);
    res.json(users);
  } catch (err) {
    console.error('Error getting users:', err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
