const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Role = require('../models/Role');
const Goal = require('../models/Goal');
const ReviewCycle = require('../models/ReviewCycle');
const { format, addMonths, startOfQuarter, endOfQuarter } = require('date-fns');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected');
    
    // Run seed function
    await seedData();
    
    console.log('Seed data created successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error connecting to MongoDB:', err.message);
    process.exit(1);
  }
};

// Seed initial data
const seedData = async () => {
  try {
    // Clear existing data
    await Role.deleteMany({});
    await User.deleteMany({});
    await Goal.deleteMany({});
    await ReviewCycle.deleteMany({});
    
    console.log('Previous data cleared');
    
    // Create roles
    const adminRole = await Role.create({ name: 'Admin' });
    const managerRole = await Role.create({ name: 'Manager' });
    const employeeRole = await Role.create({ name: 'Employee' });
    
    console.log('Roles created');
    
    // Create users
    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'password123',
      role: adminRole._id
    });
    
    const managerUser = await User.create({
      name: 'Manager User',
      email: 'manager@example.com',
      password: 'password123',
      role: managerRole._id
    });
    
    const employeeUser1 = await User.create({
      name: 'Employee One',
      email: 'employee1@example.com',
      password: 'password123',
      role: employeeRole._id
    });
    
    const employeeUser2 = await User.create({
      name: 'Employee Two',
      email: 'employee2@example.com',
      password: 'password123',
      role: employeeRole._id
    });
    
    console.log('Users created');
    
    // Create review cycles (current quarter and next quarter)
    const currentQuarterStart = startOfQuarter(new Date());
    const currentQuarterEnd = endOfQuarter(new Date());
    const nextQuarterStart = addMonths(currentQuarterStart, 3);
    const nextQuarterEnd = addMonths(currentQuarterEnd, 3);
    
    const currentCycle = await ReviewCycle.create({
      name: `Q${Math.floor(currentQuarterStart.getMonth() / 3) + 1} ${currentQuarterStart.getFullYear()}`,
      startDate: currentQuarterStart,
      endDate: currentQuarterEnd
    });
    
    await ReviewCycle.create({
      name: `Q${Math.floor(nextQuarterStart.getMonth() / 3) + 1} ${nextQuarterStart.getFullYear()}`,
      startDate: nextQuarterStart,
      endDate: nextQuarterEnd
    });
    
    console.log('Review cycles created');
    
    // Create goals
    // Company goal
    const companyGoal = await Goal.create({
      title: 'Increase Customer Satisfaction',
      description: 'Improve our overall customer satisfaction score by 15% through enhanced product features and customer service.',
      owner: adminUser._id,
      level: 'company',
      progress: 25,
      dueDate: currentQuarterEnd
    });
    
    // Department goal (linked to company goal)
    const departmentGoal = await Goal.create({
      title: 'Improve Product Usability',
      description: 'Enhance product usability by implementing user feedback and streamlining the UI/UX.',
      owner: managerUser._id,
      level: 'department',
      parentGoal: companyGoal._id,
      progress: 40,
      dueDate: currentQuarterEnd
    });
    
    // Individual goals (linked to department goal)
    await Goal.create({
      title: 'Conduct User Research',
      description: 'Conduct in-depth user research to identify pain points and gather feedback on current product experience.',
      owner: employeeUser1._id,
      level: 'individual',
      parentGoal: departmentGoal._id,
      progress: 75,
      dueDate: addMonths(new Date(), 1)
    });
    
    await Goal.create({
      title: 'Redesign Dashboard Interface',
      description: 'Create and implement a new dashboard design that improves data visualization and user navigation.',
      owner: employeeUser2._id,
      level: 'individual',
      parentGoal: departmentGoal._id,
      progress: 30,
      dueDate: addMonths(new Date(), 2)
    });
    
    // Another company goal
    const companyGoal2 = await Goal.create({
      title: 'Expand Market Reach',
      description: 'Enter two new market segments by developing targeted solutions and marketing campaigns.',
      owner: adminUser._id,
      level: 'company',
      progress: 15,
      dueDate: nextQuarterEnd
    });
    
    // Team goal (linked to company goal)
    const teamGoal = await Goal.create({
      title: 'Develop Market Research Strategy',
      description: 'Create a comprehensive market research strategy to identify opportunities in new segments.',
      owner: managerUser._id,
      level: 'team',
      parentGoal: companyGoal2._id,
      progress: 20,
      dueDate: addMonths(new Date(), 2)
    });
    
    // Individual goal (linked to team goal)
    await Goal.create({
      title: 'Competitive Analysis',
      description: 'Conduct detailed competitive analysis in target market segments to identify gaps and opportunities.',
      owner: employeeUser1._id,
      level: 'individual',
      parentGoal: teamGoal._id,
      progress: 45,
      dueDate: addMonths(new Date(), 1)
    });
    
    console.log('Goals created');
    
  } catch (err) {
    console.error('Error seeding data:', err);
    process.exit(1);
  }
};

// Run the seed script
require('dotenv').config();
connectDB();
