const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Role',
    required: true
  },
  // New fields for org chart functionality
  managerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  department: {
    type: String
  },
  title: {
    type: String
  },
  team: {
    type: String
  }
}, { timestamps: true });

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Helper method to get direct reports
UserSchema.statics.getDirectReports = async function(userId) {
  return await this.find({ managerId: userId });
};

// Helper method to get all reports (direct and indirect)
UserSchema.statics.getAllReports = async function(userId) {
  const result = [];
  const findReports = async (managerId) => {
    const directReports = await this.find({ managerId });
    for (let report of directReports) {
      result.push(report);
      await findReports(report._id);
    }
  };
  
  await findReports(userId);
  return result;
};

module.exports = mongoose.model('User', UserSchema);
