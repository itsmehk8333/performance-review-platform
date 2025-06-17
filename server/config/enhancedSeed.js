const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Role = require('../models/Role');
const Goal = require('../models/Goal');
const ReviewCycle = require('../models/ReviewCycle');
const ReviewTemplate = require('../models/ReviewTemplate');
const Review = require('../models/Review');
const Feedback = require('../models/Feedback');
const { format, addMonths, startOfQuarter, endOfQuarter, subDays, subWeeks } = require('date-fns');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected to:', process.env.MONGO_URI);
    
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
    await ReviewTemplate.deleteMany({});
    await Review.deleteMany({});
    await Feedback.deleteMany({});
    
    console.log('Previous data cleared');
    
    // Create roles
    const adminRole = await Role.create({ name: 'Admin' });
    const managerRole = await Role.create({ name: 'Manager' });
    const employeeRole = await Role.create({ name: 'Employee' });
    
    console.log('Roles created');
    
    // Create users with organization structure
    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'password123',
      role: adminRole._id,
      title: 'Chief Technology Officer',
      department: 'Executive',
      team: 'Leadership'
    });
    
    const managerUser = await User.create({
      name: 'Manager User',
      email: 'manager@example.com',
      password: 'password123',
      role: managerRole._id,
      managerId: adminUser._id,
      title: 'Engineering Director',
      department: 'Engineering',
      team: 'Engineering Leadership'
    });

    const managerUser2 = await User.create({
      name: 'Product Manager',
      email: 'productmanager@example.com',
      password: 'password123',
      role: managerRole._id,
      managerId: adminUser._id,
      title: 'Product Director',
      department: 'Product',
      team: 'Product Management'
    });
    
    const employeeUser1 = await User.create({
      name: 'Employee One',
      email: 'employee1@example.com',
      password: 'password123',
      role: employeeRole._id,
      managerId: managerUser._id,
      title: 'Senior Developer',
      department: 'Engineering',
      team: 'Frontend'
    });
    
    const employeeUser2 = await User.create({
      name: 'Employee Two',
      email: 'employee2@example.com',
      password: 'password123',
      role: employeeRole._id,
      managerId: managerUser._id,
      title: 'Backend Developer',
      department: 'Engineering',
      team: 'Backend'
    });

    const employeeUser3 = await User.create({
      name: 'Employee Three',
      email: 'employee3@example.com',
      password: 'password123',
      role: employeeRole._id,
      managerId: managerUser2._id,
      title: 'Product Designer',
      department: 'Product',
      team: 'Design'
    });
    
    console.log('Users created');
    
    // Create review cycles (current quarter and next quarter)
    const currentQuarterStart = startOfQuarter(new Date());
    const currentQuarterEnd = endOfQuarter(new Date());
    const nextQuarterStart = addMonths(currentQuarterStart, 3);
    const nextQuarterEnd = addMonths(currentQuarterEnd, 3);
    const previousQuarterStart = addMonths(currentQuarterStart, -3);
    const previousQuarterEnd = addMonths(currentQuarterEnd, -3);
    
    const previousCycle = await ReviewCycle.create({
      name: `Q${Math.floor(previousQuarterStart.getMonth() / 3) + 1} ${previousQuarterStart.getFullYear()}`,
      startDate: previousQuarterStart,
      endDate: previousQuarterEnd,
      status: 'completed',
      phases: [
        { name: 'Self Assessment', status: 'completed' },
        { name: 'Peer Review', status: 'completed' },
        { name: 'Manager Review', status: 'completed' },
        { name: 'Calibration', status: 'completed' }
      ]
    });
    
    const currentCycle = await ReviewCycle.create({
      name: `Q${Math.floor(currentQuarterStart.getMonth() / 3) + 1} ${currentQuarterStart.getFullYear()}`,
      startDate: currentQuarterStart,
      endDate: currentQuarterEnd,
      status: 'in-progress',
      phases: [
        { name: 'Self Assessment', status: 'completed' },
        { name: 'Peer Review', status: 'in-progress' },
        { name: 'Manager Review', status: 'not-started' },
        { name: 'Calibration', status: 'not-started' }
      ]
    });
    
    await ReviewCycle.create({
      name: `Q${Math.floor(nextQuarterStart.getMonth() / 3) + 1} ${nextQuarterStart.getFullYear()}`,
      startDate: nextQuarterStart,
      endDate: nextQuarterEnd,
      status: 'planned',
      phases: [
        { name: 'Self Assessment', status: 'not-started' },
        { name: 'Peer Review', status: 'not-started' },
        { name: 'Manager Review', status: 'not-started' },
        { name: 'Calibration', status: 'not-started' }
      ]
    });
    
    console.log('Review cycles created');
    
    // Create review templates
    const performanceTemplate = await ReviewTemplate.create({
      name: 'Performance Review Template',
      description: 'Comprehensive performance evaluation with ratings and feedback',
      questions: [
        {
          text: 'What were the key accomplishments during this review period?',
          type: 'text',
          required: true
        },
        {
          text: 'Rate technical skills',
          type: 'rating',
          required: true
        },
        {
          text: 'Rate collaboration and teamwork',
          type: 'rating',
          required: true
        },
        {
          text: 'Rate communication skills',
          type: 'rating',
          required: true
        },
        {
          text: 'What are areas for improvement?',
          type: 'text',
          required: true
        }
      ]
    });

    const selfAssessmentTemplate = await ReviewTemplate.create({
      name: 'Self Assessment Template',
      description: 'Self-evaluation of performance and goals',
      questions: [
        {
          text: 'What are your key achievements this quarter?',
          type: 'text',
          required: true
        },
        {
          text: 'How would you rate your overall performance?',
          type: 'rating',
          required: true
        },
        {
          text: 'What challenges did you face and how did you overcome them?',
          type: 'text',
          required: true
        },
        {
          text: 'What are your goals for the next quarter?',
          type: 'text',
          required: true
        }
      ]
    });

    const peerReviewTemplate = await ReviewTemplate.create({
      name: 'Peer Review Template',
      description: 'Colleague feedback and evaluation',
      questions: [
        {
          text: 'How effective is this person at collaborating with the team?',
          type: 'rating',
          required: true
        },
        {
          text: 'What are this person\'s greatest strengths?',
          type: 'text',
          required: true
        },
        {
          text: 'In what areas could this person improve?',
          type: 'text',
          required: true
        }
      ]
    });
    
    console.log('Review templates created');
    
    // Create goals
    // Company goal
    const companyGoal = await Goal.create({
      title: 'Increase Customer Satisfaction',
      description: 'Improve our overall customer satisfaction score by 15% through enhanced product features and customer service.',
      owner: adminUser._id,
      level: 'company',
      progress: 25,
      dueDate: currentQuarterEnd,
      tags: ['customer', 'satisfaction', 'quality']
    });
    
    // Department goal (linked to company goal)
    const departmentGoal = await Goal.create({
      title: 'Improve Product Usability',
      description: 'Enhance product usability by implementing user feedback and streamlining the UI/UX.',
      owner: managerUser._id,
      level: 'department',
      parentGoal: companyGoal._id,
      progress: 40,
      dueDate: currentQuarterEnd,
      tags: ['usability', 'ui/ux', 'design']
    });
    
    // Individual goals (linked to department goal)
    const individualGoal1 = await Goal.create({
      title: 'Conduct User Research',
      description: 'Conduct in-depth user research to identify pain points and gather feedback on current product experience.',
      owner: employeeUser1._id,
      level: 'individual',
      parentGoal: departmentGoal._id,
      progress: 75,
      dueDate: addMonths(new Date(), 1),
      tags: ['research', 'user-experience']
    });
    
    const individualGoal2 = await Goal.create({
      title: 'Redesign Dashboard Interface',
      description: 'Create and implement a new dashboard design that improves data visualization and user navigation.',
      owner: employeeUser2._id,
      level: 'individual',
      parentGoal: departmentGoal._id,
      progress: 30,
      dueDate: addMonths(new Date(), 2),
      tags: ['design', 'dashboard', 'visualization']
    });
    
    // Another company goal
    const companyGoal2 = await Goal.create({
      title: 'Expand Market Reach',
      description: 'Enter two new market segments by developing targeted solutions and marketing campaigns.',
      owner: adminUser._id,
      level: 'company',
      progress: 15,
      dueDate: nextQuarterEnd,
      tags: ['market', 'growth', 'expansion']
    });
    
    // Team goal (linked to company goal)
    const teamGoal = await Goal.create({
      title: 'Develop Market Research Strategy',
      description: 'Create comprehensive market research plan to identify opportunities in new segments.',
      owner: managerUser2._id,
      level: 'team',
      parentGoal: companyGoal2._id,
      progress: 50,
      dueDate: addMonths(new Date(), 1),
      tags: ['research', 'strategy', 'market-analysis']
    });

    const productGoal = await Goal.create({
      title: 'Implement New Feature Set',
      description: 'Design and develop new feature set for enterprise customers',
      owner: employeeUser3._id,
      level: 'individual',
      parentGoal: teamGoal._id,
      progress: 25,
      dueDate: addMonths(new Date(), 2),
      tags: ['product', 'features', 'enterprise']
    });
    
    console.log('Goals created');

    // Create reviews
    // Self assessments
    const selfAssessment1 = await Review.create({
      cycleId: currentCycle._id,
      templateId: selfAssessmentTemplate._id,
      reviewer: employeeUser1._id,
      reviewee: employeeUser1._id,
      type: 'self',
      status: 'submitted',
      responses: [
        {
          question: 'What are your key achievements this quarter?',
          answer: 'I successfully completed the user research project ahead of schedule and identified key improvement areas. I also contributed to improving our A/B testing framework.',
          type: 'text'
        },
        {
          question: 'How would you rate your overall performance?',
          answer: '4',
          type: 'rating'
        },
        {
          question: 'What challenges did you face and how did you overcome them?',
          answer: 'The biggest challenge was getting enough user participants. I overcame this by expanding our recruitment channels and offering better incentives.',
          type: 'text'
        },
        {
          question: 'What are your goals for the next quarter?',
          answer: 'I want to focus on implementing the key findings from the research and measuring the impact on user satisfaction.',
          type: 'text'
        }
      ],
      sentiment: {
        positive: 0.65,
        negative: 0.15,
        neutral: 0.20
      }
    });

    const selfAssessment2 = await Review.create({
      cycleId: currentCycle._id,
      templateId: selfAssessmentTemplate._id,
      reviewer: employeeUser2._id,
      reviewee: employeeUser2._id,
      type: 'self',
      status: 'submitted',
      responses: [
        {
          question: 'What are your key achievements this quarter?',
          answer: 'I redesigned the dashboard interface improving load time by 40% and implemented new visualization components that received positive user feedback.',
          type: 'text'
        },
        {
          question: 'How would you rate your overall performance?',
          answer: '4',
          type: 'rating'
        },
        {
          question: 'What challenges did you face and how did you overcome them?',
          answer: 'Performance optimization was challenging with the complex data we display. I spent extra time learning advanced optimization techniques and consulted with our backend team.',
          type: 'text'
        },
        {
          question: 'What are your goals for the next quarter?',
          answer: 'I plan to implement the mobile responsive version of our dashboard and create a component library to improve development efficiency.',
          type: 'text'
        }
      ],
      sentiment: {
        positive: 0.72,
        negative: 0.08,
        neutral: 0.20
      }
    });

    // Peer reviews
    const peerReview1 = await Review.create({
      cycleId: currentCycle._id,
      templateId: peerReviewTemplate._id,
      reviewer: employeeUser2._id,
      reviewee: employeeUser1._id,
      type: 'peer',
      status: 'submitted',
      responses: [
        {
          question: 'How effective is this person at collaborating with the team?',
          answer: '5',
          type: 'rating'
        },
        {
          question: 'What are this person\'s greatest strengths?',
          answer: 'Employee One is exceptional at gathering user insights and translating them into actionable product improvements. They communicate complex research findings clearly and are always willing to help team members.',
          type: 'text'
        },
        {
          question: 'In what areas could this person improve?',
          answer: 'Sometimes they take on too many tasks at once. Better prioritization and delegation would help them focus on the most impactful work.',
          type: 'text'
        }
      ],
      sentiment: {
        positive: 0.78,
        negative: 0.12,
        neutral: 0.10
      }
    });

    const peerReview2 = await Review.create({
      cycleId: currentCycle._id,
      templateId: peerReviewTemplate._id,
      reviewer: employeeUser1._id,
      reviewee: employeeUser2._id,
      type: 'peer',
      status: 'in-progress',
      responses: [
        {
          question: 'How effective is this person at collaborating with the team?',
          answer: '4',
          type: 'rating'
        },
        {
          question: 'What are this person\'s greatest strengths?',
          answer: 'Employee Two has incredible technical skills and creates elegant, performant code. Their dashboard redesign was impressive and shows great attention to detail.',
          type: 'text'
        },
        {
          question: 'In what areas could this person improve?',
          answer: '',
          type: 'text'
        }
      ]
    });

    // Manager reviews from previous cycle
    const managerReview1 = await Review.create({
      cycleId: previousCycle._id,
      templateId: performanceTemplate._id,
      reviewer: managerUser._id,
      reviewee: employeeUser1._id,
      type: 'manager',
      status: 'submitted',
      responses: [
        {
          question: 'What were the key accomplishments during this review period?',
          answer: 'Employee One showed exceptional work in leading the user research initiative that directly influenced our product roadmap. They consistently delivered high-quality work and exceeded expectations.',
          type: 'text'
        },
        {
          question: 'Rate technical skills',
          answer: '4',
          type: 'rating'
        },
        {
          question: 'Rate collaboration and teamwork',
          answer: '5',
          type: 'rating'
        },
        {
          question: 'Rate communication skills',
          answer: '4',
          type: 'rating'
        },
        {
          question: 'What are areas for improvement?',
          answer: 'Would benefit from developing more strategic thinking skills and taking a more proactive approach to career development.',
          type: 'text'
        }
      ],
      sentiment: {
        positive: 0.82,
        negative: 0.05,
        neutral: 0.13
      }
    });

    const managerReview2 = await Review.create({
      cycleId: previousCycle._id,
      templateId: performanceTemplate._id,
      reviewer: managerUser._id,
      reviewee: employeeUser2._id,
      type: 'manager',
      status: 'submitted',
      responses: [
        {
          question: 'What were the key accomplishments during this review period?',
          answer: 'Employee Two demonstrated strong technical expertise in reimagining our dashboard interface. Their work on performance optimization resulted in significant improvements to user experience.',
          type: 'text'
        },
        {
          question: 'Rate technical skills',
          answer: '5',
          type: 'rating'
        },
        {
          question: 'Rate collaboration and teamwork',
          answer: '3',
          type: 'rating'
        },
        {
          question: 'Rate communication skills',
          answer: '3',
          type: 'rating'
        },
        {
          question: 'What are areas for improvement?',
          answer: 'Need to improve cross-functional collaboration and communication. Sometimes technical decisions are made without properly consulting other stakeholders.',
          type: 'text'
        }
      ],
      sentiment: {
        positive: 0.60,
        negative: 0.25,
        neutral: 0.15
      }
    });

    console.log('Reviews created');

    // Create feedback
    const dates = Array.from({ length: 10 }, (_, i) => subDays(new Date(), i * 3));
    const weekDates = Array.from({ length: 8 }, (_, i) => subWeeks(new Date(), i));

    const feedback1 = await Feedback.create({
      text: "Great work on the recent user research project! Your insights were extremely valuable and helped us prioritize the right features.",
      goalId: individualGoal1._id,
      sender: managerUser._id,
      recipient: employeeUser1._id,
      tags: ['positive', 'research', 'impact'],
      createdAt: dates[0]
    });

    const feedback2 = await Feedback.create({
      text: "The dashboard redesign is looking good, but we need to address the loading performance issues. Let's set up a meeting to discuss potential solutions.",
      goalId: individualGoal2._id,
      sender: managerUser._id,
      recipient: employeeUser2._id,
      tags: ['constructive', 'performance', 'design'],
      createdAt: dates[1]
    });

    const feedback3 = await Feedback.create({
      text: "Your presentation at the team meeting was excellent. You clearly communicated complex information in an accessible way.",
      sender: employeeUser2._id,
      recipient: employeeUser1._id,
      tags: ['positive', 'communication', 'teamwork'],
      createdAt: dates[2]
    });

    const feedback4 = await Feedback.create({
      text: "I appreciate your help with troubleshooting the API integration issues. Your technical expertise saved us a lot of time.",
      sender: employeeUser1._id,
      recipient: employeeUser2._id,
      tags: ['positive', 'technical', 'helpful'],
      createdAt: dates[3]
    });

    const feedback5 = await Feedback.create({
      text: "Thanks for stepping in to help with the customer issue yesterday. Your quick response prevented an escalation.",
      sender: managerUser._id,
      recipient: employeeUser1._id,
      tags: ['positive', 'customer', 'responsive'],
      createdAt: weekDates[0]
    });

    // Create more feedback for analytics data
    for (let i = 4; i < dates.length; i++) {
      await Feedback.create({
        text: `Regular feedback item ${i} with some constructive points about ongoing projects and collaboration.`,
        sender: [managerUser._id, employeeUser1._id, employeeUser2._id][i % 3],
        recipient: [employeeUser1._id, employeeUser2._id, managerUser._id][(i+1) % 3],
        tags: ['feedback', 'collaboration'],
        createdAt: dates[i]
      });
    }

    // Create weekly feedback for analytics
    for (let i = 1; i < weekDates.length; i++) {
      await Feedback.create({
        text: `Weekly feedback for week ${i} about progress and team collaboration.`,
        sender: [managerUser._id, employeeUser1._id, employeeUser2._id][i % 3],
        recipient: [employeeUser1._id, employeeUser2._id, managerUser._id][(i+2) % 3],
        tags: ['weekly', 'progress'],
        createdAt: weekDates[i]
      });
    }

    console.log('Feedback created');
    
    console.log('Database seeded successfully!');
  } catch (err) {
    console.error('Error seeding data:', err);
    process.exit(1);
  }
};

// Run the function
connectDB();
