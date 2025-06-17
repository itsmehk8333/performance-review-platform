const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Role = require('../models/Role');

const auth = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ msg: 'No token, authorization denied' });
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user
    const user = await User.findById(decoded.id).populate('role');
    
    if (!user) {
      return res.status(401).json({ msg: 'Token is not valid' });
    }
    
    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};

// Middleware to check if user has admin role
const adminOnly = async (req, res, next) => {
  try {
    if (!req.user || !req.user.role || req.user.role.name !== 'Admin') {
      return res.status(403).json({ msg: 'Access denied: Admin only' });
    }
    next();
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

// Middleware to check if user has manager role or above
const managerOrAbove = async (req, res, next) => {
  try {
    console.log('Manager or Admin check for user:', req.user ? req.user._id : 'no user');
    console.log('User role:', req.user && req.user.role ? (typeof req.user.role === 'object' ? req.user.role.name : req.user.role) : 'no role');
    
    if (!req.user) {
      console.log('Auth failed: No user in request');
      return res.status(403).json({ msg: 'Access denied: Manager or Admin only' });
    }
    
    if (!req.user.role) {
      console.log('Auth failed: User has no role');
      return res.status(403).json({ msg: 'Access denied: Manager or Admin only' });
    }
    
    // Handle both object roles and string roles
    const roleName = typeof req.user.role === 'object' ? req.user.role.name : req.user.role;
    
    if (roleName !== 'Manager' && roleName !== 'Admin') {
      console.log(`Auth failed: User role ${roleName} is not Manager or Admin`);
      return res.status(403).json({ msg: 'Access denied: Manager or Admin only' });
    }
    
    console.log('Auth succeeded: User is a', roleName);
    next();
  } catch (err) {
    console.error('Error in managerOrAbove middleware:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

module.exports = { 
  auth, 
  adminOnly, 
  managerOrAbove, 
  managerOrAdminOnly: managerOrAbove,
  managerAndAbove: managerOrAbove 
};
