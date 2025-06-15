const mongoose = require('mongoose');

const RoleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    enum: ['Admin', 'Manager', 'Employee'],
    unique: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Role', RoleSchema);
