const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const ReviewCycle = require('../models/ReviewCycle');
const Review = require('../models/Review');
const ReviewTemplate = require('../models/ReviewTemplate');
const User = require('../models/User');
const { adminOnly, managerAndAbove, auth, managerOrAdminOnly } = require('../middleware/auth');
const { Parser } = require('json2csv');
const PDFDocument = require('pdfkit');
// Import our new services
const ReviewAssignmentService = require('../services/ReviewAssignmentService');
const WorkflowService = require('../services/WorkflowService');
const ApprovalService = require('../services/ApprovalService');

// @route   POST api/reviews/cycles
// @desc    Create a new review cycle
// @access  Private - Admin only
router.post('/cycles', adminOnly, async (req, res) => {
  try {
    const { 
      name, 
      description, 
      startDate, 
      endDate, 
      cycleType, 
      reviewTypes, 
      anonymitySettings, 
      participants,
      templateId,
      recurrence
    } = req.body;
    
    // Create new review cycle
    const newCycle = new ReviewCycle({
      name,
      description,
      startDate,
      endDate,
      status: 'planning',
      cycleType: cycleType || 'custom',
      reviewTypes: reviewTypes || { self: true, peer: true, manager: true, upward: false },
      anonymitySettings: anonymitySettings || { 
        peerReviews: 'full', 
        upwardReviews: 'full' 
      },
      participants,
      templateId,
      recurrence: recurrence || { isRecurring: false, frequency: 'annual' }
    });
    
    const cycle = await newCycle.save();
    
    res.json(cycle);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/reviews/cycles
// @desc    Get all review cycles
// @access  Private
router.get('/cycles', auth, async (req, res) => {
  try {
    const cycles = await ReviewCycle.find()
      .populate('templateId', 'name')
      .sort({ startDate: -1 });
    
    res.json(cycles);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/reviews/cycles/:id
// @desc    Get review cycle by ID
// @access  Private
router.get('/cycles/:id', async (req, res) => {
  try {
    const cycle = await ReviewCycle.findById(req.params.id)
      .populate('templateId', 'name questions')
      .populate('participants', 'name email');
    
    if (!cycle) {
      return res.status(404).json({ msg: 'Review cycle not found' });
    }
    
    res.json(cycle);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Review cycle not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   PUT api/reviews/cycles/:id
// @desc    Update a review cycle
// @access  Private - Manager or Admin
router.put('/cycles/:id', managerAndAbove, async (req, res) => {
  try {
    const { 
      name, 
      description, 
      startDate, 
      endDate, 
      status,
      cycleType, 
      reviewTypes, 
      anonymitySettings, 
      participants,
      templateId,
      recurrence
    } = req.body;
    
    // Find and update cycle
    const cycle = await ReviewCycle.findById(req.params.id);
    
    if (!cycle) {
      return res.status(404).json({ msg: 'Review cycle not found' });
    }
    
    // Update fields
    if (name) cycle.name = name;
    if (description) cycle.description = description;
    if (startDate) cycle.startDate = startDate;
    if (endDate) cycle.endDate = endDate;
    if (status) cycle.status = status;
    if (cycleType) cycle.cycleType = cycleType;
    if (reviewTypes) cycle.reviewTypes = reviewTypes;
    if (anonymitySettings) cycle.anonymitySettings = anonymitySettings;
    if (participants) cycle.participants = participants;
    if (templateId) cycle.templateId = templateId;
    if (recurrence) cycle.recurrence = recurrence;
    
    await cycle.save();
    
    res.json(cycle);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Review cycle not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   DELETE api/reviews/cycles/:id
// @desc    Delete a review cycle
// @access  Private - Admin only
router.delete('/cycles/:id', adminOnly, async (req, res) => {
  try {
    const cycle = await ReviewCycle.findById(req.params.id);
    
    if (!cycle) {
      return res.status(404).json({ msg: 'Review cycle not found' });
    }
    
    // First remove all reviews associated with this cycle
    await Review.deleteMany({ cycleId: req.params.id });
    
    // Then remove the cycle
    await cycle.remove();
    
    res.json({ msg: 'Review cycle removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Review cycle not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   POST api/reviews/assign
// @desc    Assign reviews for a cycle
// @access  Private - Manager or Admin
router.post('/assign', managerAndAbove, async (req, res) => {
  try {    const { cycleId, selectedUsers, reviewTypes = [], peerCount, upwardCount } = req.body;
    
    // Validate cycle ID
    if (!cycleId) {
      return res.status(400).json({ msg: 'Review cycle ID is required' });
    }
    
    // Find the cycle
    const cycle = await ReviewCycle.findById(cycleId).populate('templateId');
    
    if (!cycle) {
      return res.status(404).json({ msg: 'Review cycle not found' });
    }
    
    if (!cycle.templateId) {
      return res.status(400).json({ msg: 'Review template must be assigned to cycle before assigning reviews' });
    }
    
    // Update cycle's reviewTypes based on selected types (temporary, for this assignment)
    const cycleReviewTypes = {
      self: reviewTypes.includes('self'),
      peer: reviewTypes.includes('peer'),
      manager: reviewTypes.includes('manager'),
      upward: reviewTypes.includes('upward')
    };
    
    // Get all users
    let users;
    if (selectedUsers && selectedUsers.length > 0) {
      users = await User.find({ _id: { $in: selectedUsers } }).populate('role');
    } else {
      users = await User.find().populate('role');
    }
    
    // Group users by role
    const admins = users.filter(user => user.role.name === 'Admin');
    const managers = users.filter(user => user.role.name === 'Manager');
    const employees = users.filter(user => user.role.name === 'Employee');
    
    const reviews = [];
      // Create reviews based on types in the request
    if (cycleReviewTypes.self) {      // Self-assessments for everyone
      for (const user of users) {
        reviews.push({
          cycleId,
          templateId: cycle.templateId._id,
          reviewer: user._id,
          reviewee: user._id,
          type: 'self',
          status: 'pending', // Explicitly set status to pending
          isAnonymous: false // Self reviews are never anonymous
        });
      }
    }
    
    if (cycleReviewTypes.peer) {
      // Assign peer reviews among employees
      const peerReviewCount = peerCount || 2; // Default to 2 peer reviews if not specified
      
      for (const employee of employees) {
        // Assign peers to review each employee
        const peers = employees.filter(e => !e._id.equals(employee._id));
        const selectedPeers = peers.sort(() => 0.5 - Math.random()).slice(0, peerReviewCount);
        
        for (const peer of selectedPeers) {          reviews.push({
            cycleId,
            templateId: cycle.templateId._id,
            reviewer: peer._id,
            reviewee: employee._id,
            type: 'peer',
            status: 'pending', // Explicitly set status to pending
            isAnonymous: cycle.anonymitySettings.peerReviews === 'full',
            visibleToReviewee: cycle.anonymitySettings.peerReviews !== 'none'
          });
        }
      }
    }
      if (cycleReviewTypes.manager) {
      // Managers review their employees
      // In a real system, you'd use a reporting hierarchy
      // For now, we'll randomly assign managers to employees
      for (const employee of employees) {
        const manager = managers[Math.floor(Math.random() * managers.length)];        reviews.push({
          cycleId,
          templateId: cycle.templateId._id,
          reviewer: manager._id,
          reviewee: employee._id,
          type: 'manager',
          status: 'pending', // Explicitly set status to pending
          isAnonymous: false // Manager reviews are never anonymous
        });
      }
    }
      if (cycleReviewTypes.upward) {
      // Employees review their managers
      const upwardReviewCount = upwardCount || 3; // Default to 3 upward reviews if not specified
      
      for (const manager of managers) {
        // Each manager gets reviewed by some employees
        const selectedEmployees = employees
          .sort(() => 0.5 - Math.random())
          .slice(0, upwardReviewCount);
          
        for (const employee of selectedEmployees) {          reviews.push({
            cycleId,
            templateId: cycle.templateId._id,
            reviewer: employee._id,
            reviewee: manager._id,
            type: 'upward',
            status: 'pending', // Explicitly set status to pending
            isAnonymous: cycle.anonymitySettings.upwardReviews === 'full',
            visibleToReviewee: cycle.anonymitySettings.upwardReviews !== 'none'
          });
        }
      }
    }
    
    // Create review documents
    await Review.insertMany(reviews);
    
    // Update cycle status to 'self' phase
    cycle.status = 'self';
    await cycle.save();
    
    res.json({ msg: `Successfully assigned ${reviews.length} reviews` });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/reviews
// @desc    Get reviews with optional filters
// @access  Private
router.get('/', async (req, res) => {
  try {
    const { cycleId, revieweeId, reviewerId, type, status } = req.query;
    
    // Build filter object
    const filter = {};
    
    if (cycleId) {
      filter.cycleId = cycleId;
    }
    
    if (revieweeId) {
      filter.reviewee = revieweeId;
    }
    
    if (reviewerId) {
      filter.reviewer = reviewerId;
    }
    
    if (type) {
      filter.type = type;
    }
    
    if (status) {
      filter.status = status;
    }
      // If not admin or manager, only show reviews where current user is reviewer or reviewee
    const isAdminOrManager = req.user.role.name === 'Admin' || req.user.role.name === 'Manager';
    
    if (!isAdminOrManager) {
      filter.$or = [
        { reviewer: req.user.id },
        { reviewee: req.user.id } // Allow users to see all reviews about them, regardless of visibility flag
      ];
    }
    
    const reviews = await Review.find(filter)
      .populate('reviewer', 'name email')
      .populate('reviewee', 'name email')
      .populate('cycleId', 'name startDate endDate status anonymitySettings')
      .populate('templateId', 'name')
      .sort({ createdAt: -1 });
      // For non-admin/non-manager users, apply anonymity rules
    if (!isAdminOrManager) {
      reviews.forEach(review => {
        // If the current user is the reviewee and the review is anonymous
        if (review.reviewee._id.toString() === req.user.id) {
          // Set visibility for the reviewee
          review.visibleToReviewee = true;
          
          // If the review is anonymous, mask the reviewer information
          if (review.isAnonymous) {
            review.reviewer = { name: 'Anonymous', email: 'anonymous@example.com' };
          }
        }
      });
    }
    
    res.json(reviews);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/reviews/:id/submit
// @desc    Submit a review
// @access  Private
router.post('/:id/submit', async (req, res) => {
  try {
    const { answers, content, ratings, summaryFeedback, overallRating } = req.body;
    
    const review = await Review.findById(req.params.id)
      .populate('cycleId')
      .populate('templateId');
    
    if (!review) {
      return res.status(404).json({ msg: 'Review not found' });
    }
    
    // Validate that the current user is the assigned reviewer
    if (review.reviewer.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Not authorized to submit this review' });
    }
    
    // Check if review has already been submitted
    if (review.status === 'submitted' || review.status === 'calibrated') {
      return res.status(400).json({ msg: 'This review has already been submitted' });
    }
    
    // Check if the review cycle is in the appropriate phase
    if (review.cycleId.status === 'planning' || review.cycleId.status === 'completed') {
      return res.status(400).json({ msg: 'Review cycle is not in an active review phase' });
    }
    
    // For self reviews, check if we're in the self-assessment phase
    if (review.type === 'self' && review.cycleId.status !== 'self') {
      return res.status(400).json({ msg: 'Self-assessment phase is closed' });
    }
    
    // For peer reviews, check if we're in the peer or later phase
    if (review.type === 'peer' && !['peer', 'manager', 'upward', 'calibration'].includes(review.cycleId.status)) {
      return res.status(400).json({ msg: 'Peer review phase is not open yet' });
    }
    
    // For manager reviews, check if we're in the manager or later phase
    if (review.type === 'manager' && !['manager', 'upward', 'calibration'].includes(review.cycleId.status)) {
      return res.status(400).json({ msg: 'Manager review phase is not open yet' });
    }
    
    // For upward reviews, check if we're in the upward or calibration phase
    if (review.type === 'upward' && !['upward', 'calibration'].includes(review.cycleId.status)) {
      return res.status(400).json({ msg: 'Upward review phase is not open yet' });
    }
      // Update review
    if (content) review.content = content; // Legacy support
    if (ratings) review.ratings = ratings; // Legacy support
    
    // New structured format
    if (answers) review.answers = answers;
    if (summaryFeedback) review.summaryFeedback = summaryFeedback;
    if (overallRating) review.overallRating = overallRating;
    review.status = 'submitted';
    review.submittedAt = Date.now();
    
    // Set approvalStatus to pending when a review is submitted
    // This ensures the review appears in the manager's pending approvals list
    review.approvalStatus = 'pending';
      // Perform sentiment analysis on review content
    const SentimentService = require('../services/SentimentService');
    try {
      console.log('Running sentiment analysis on review...');
      console.log('Review before sentiment analysis:', JSON.stringify({
        id: review._id,
        type: review.type,
        status: review.status,
        hasAnswers: review.answers && review.answers.length > 0
      }));
      const analyzedReview = await SentimentService.analyzeReview(review);
      console.log(`Sentiment analysis complete. Overall sentiment: ${analyzedReview.overallSentimentLabel}`);
      console.log('Sample of analyzed answers:', JSON.stringify(
        analyzedReview.answers.slice(0, 1).map(a => ({
          question: a.questionId,
          sentiment: a.sentimentLabel,
          flags: a.vaguenessFlags
        }))
      ));
    } catch (sentimentError) {
      console.error('Error performing sentiment analysis:', sentimentError);
      // Continue with submission even if sentiment analysis fails
    }
    
    await review.save();
    res.json(review);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/reviews/export
// @desc    Export reviews as CSV or PDF
// @access  Private (Manager or Admin)
router.get('/export', auth, async (req, res) => {
  try {
    // Check if user and user.role exist
    if (!req.user) {
      console.log('Auth failed in reviews export: No user in request');
      return res.status(403).json({ msg: 'Authentication required' });
    }
    
    console.log('User object in reviews export:', JSON.stringify(req.user));
    
    if (!req.user.role) {
      console.log('Auth failed in reviews export: User has no role property');
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
      console.log(`Auth failed in reviews export: User role ${roleName} is not Manager or Admin`);
      return res.status(403).json({ msg: 'Access denied: Manager or Admin only' });
    }
    
    console.log('Reviews export access granted to:', req.user._id || req.user.id, 'with role:', roleName);
    
    const { cycleId, type, format } = req.query;
    
    // Build filter object
    const filter = {};
    
    if (cycleId) {
      filter.cycleId = cycleId;
    }
    
    if (type) {
      filter.type = type;
    }
    
    // If not admin, only show reviews for manager's team members
    if (req.user.role.name !== 'Admin') {
      // Get all users who report to this manager
      const teamMembers = await User.find({ managerId: req.user.id }).select('_id');
      const teamMemberIds = teamMembers.map(member => member._id);
      
      // Include the manager's own reviews as well
      teamMemberIds.push(req.user.id);
      
      filter.$or = [
        { reviewer: { $in: teamMemberIds } },
        { reviewee: { $in: teamMemberIds } }
      ];
    }
    
    const reviews = await Review.find(filter)
      .populate('reviewer', 'name email')
      .populate('reviewee', 'name email')
      .populate('cycleId', 'name')
      .sort({ createdAt: -1 });
    
    if (format === 'pdf') {
      // Generate PDF
      const doc = new PDFDocument();
      
      // Set response headers
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=reviews-export.pdf');
      
      // Pipe the PDF to the response
      doc.pipe(res);
      
      // Add content to PDF
      doc.fontSize(16).text('Reviews Export', { align: 'center' });
      doc.moveDown();
      
      reviews.forEach((review, index) => {
        doc.fontSize(12).text(`Review #${index + 1}`);
        doc.fontSize(10).text(`Cycle: ${review.cycleId.name}`);
        doc.fontSize(10).text(`Type: ${review.type}`);
        doc.fontSize(10).text(`Reviewer: ${review.reviewer.name} (${review.reviewer.email})`);
        doc.fontSize(10).text(`Reviewee: ${review.reviewee.name} (${review.reviewee.email})`);        doc.fontSize(10).text(`Status: ${review.status}`);
        doc.fontSize(10).text(`Date: ${review.submittedAt ? new Date(review.submittedAt).toLocaleString() : 'Not submitted'}`);
        doc.moveDown();
        
        doc.fontSize(10).text('Content:');
        doc.fontSize(10).text(`${review.content || 'No content'}`);
        doc.moveDown();
        
        doc.fontSize(10).text('Ratings:');
        if (review.ratings && Object.keys(review.ratings).length > 0) {
          // Safely extract ratings and format them properly
          try {
            // Check if ratings is a Map or an Object
            if (review.ratings instanceof Map) {
              for (const [key, value] of review.ratings.entries()) {
                doc.fontSize(10).text(`${key}: ${value}/5`);
              }
            } else {
              // Handle as regular object
              Object.entries(review.ratings).forEach(([key, value]) => {
                doc.fontSize(10).text(`${key}: ${value}/5`);
              });
            }
          } catch (error) {
            console.error('Error formatting ratings:', error);
            doc.fontSize(10).text('Error displaying ratings data');
          }
        } else {
          doc.fontSize(10).text('No ratings provided');
        }
        
        doc.moveDown();
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown();
      });
      
      // Finalize PDF
      doc.end();
    } else {
      // Default to CSV
      const fields = [
        { label: 'Cycle', value: 'cycleId.name' },
        { label: 'Type', value: 'type' },
        { label: 'Reviewer', value: 'reviewer.name' },
        { label: 'Reviewer Email', value: 'reviewer.email' },
        { label: 'Reviewee', value: 'reviewee.name' },
        { label: 'Reviewee Email', value: 'reviewee.email' },
        { label: 'Status', value: 'status' },
        { label: 'Content', value: 'content' },
        { label: 'Submitted Date', value: 'submittedAt' }
      ];
      
      // Transform ratings Map to flat fields
      const flattenedReviews = reviews.map(review => {
        const flatReview = { ...review.toObject() };
        
        // Flatten ratings if they exist
        if (review.ratings && Object.keys(review.ratings).length > 0) {
          for (const [key, value] of Object.entries(review.ratings)) {
            flatReview[`Rating_${key}`] = value;
          }
        }
        
        return flatReview;
      });
      
      const json2csvParser = new Parser({ fields });
      const csv = json2csvParser.parse(flattenedReviews);
      
      // Set response headers
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=reviews-export.csv');
      
      // Send CSV
      res.send(csv);
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/reviews/pending-approvals
// @desc    Get reviews pending approval for the current user
// @access  Private - Manager and above
router.get('/pending-approvals', managerAndAbove, async (req, res) => {
  try {
    console.log('Fetching pending approvals for user:', req.user.id);
    let pendingReviews;
    
    // If admin, get all pending approvals
    if (req.user.role === 'Admin') {
      console.log('User is admin, fetching all pending approvals');
      pendingReviews = await ApprovalService.getAllPendingApprovals();
    } else {
      // Otherwise get only approvals for direct reports
      console.log('User is manager, fetching pending approvals for direct reports');
      pendingReviews = await ApprovalService.getPendingApprovals(req.user.id);
    }
    
    console.log(`Found ${pendingReviews.length} pending approvals`);
    res.json(pendingReviews);
  } catch (err) {
    console.error('Error in pending-approvals endpoint:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/reviews/:id/approve
// @desc    Approve a review
// @access  Private - Manager and above
router.post('/:id/approve', managerAndAbove, async (req, res) => {
  try {
    console.log(`Approving review ${req.params.id} by user ${req.user.id}`);
    const review = await ApprovalService.approveReview(req.params.id, req.user.id);
    console.log(`Review ${req.params.id} approved successfully`);
    res.json(review);
  } catch (err) {
    console.error('Error approving review:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/reviews/:id/reject
// @desc    Reject a review
// @access  Private - Manager and above
router.post('/:id/reject', managerAndAbove, async (req, res) => {
  try {
    const { rejectionReason } = req.body;
    
    if (!rejectionReason) {
      return res.status(400).json({ msg: 'Rejection reason is required' });
    }
    
    console.log(`Rejecting review ${req.params.id} by user ${req.user.id} with reason: ${rejectionReason}`);
    const review = await ApprovalService.rejectReview(req.params.id, req.user.id, rejectionReason);
    console.log(`Review ${req.params.id} rejected successfully`);
    res.json(review);
  } catch (err) {
    console.error('Error rejecting review:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/reviews/:id
// @desc    Get review by ID
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const review = await Review.findById(req.params.id)
      .populate('reviewer', 'name email')
      .populate('reviewee', 'name email')
      .populate('cycleId', 'name startDate endDate status anonymitySettings')
      .populate('templateId', 'name questions');
    
    if (!review) {
      return res.status(404).json({ msg: 'Review not found' });
    }
      // Add detailed logging
    console.log(`GET /reviews/${req.params.id} - Populated review:`, {
      id: review._id,
      reviewer: review.reviewer ? `${review.reviewer.name} (${review.reviewer._id})` : null,
      reviewee: review.reviewee ? `${review.reviewee.name} (${review.reviewee._id})` : null,
      cycleId: review.cycleId ? `${review.cycleId.name} (${review.cycleId._id})` : null,
      templateId: review.templateId ? `${review.templateId.name} (${review.templateId._id})` : null,
      status: review.status,
      type: review.type
    });
      // Check if the review has the necessary cycle information
    if (!review.cycleId) {
      console.warn(`Review ${req.params.id} is missing cycleId information`);
      
      // Try to find the cycle information manually if it's missing due to population issue
      if (review.cycleId && typeof review.cycleId === 'string') {
        try {
          console.log(`Attempting to manually populate cycleId: ${review.cycleId}`);
          const cycle = await ReviewCycle.findById(review.cycleId);
          if (cycle) {
            review.cycleId = cycle;
            console.log(`Successfully populated cycleId: ${cycle.name} (${cycle._id})`);
          }
        } catch (error) {
          console.error('Error manually populating cycleId:', error);
        }
      }
    }
    
    // Check if the review has the necessary template information
    if (!review.templateId) {
      console.warn(`Review ${req.params.id} is missing templateId information`);
      
      // Try to find the original templateId value if it's missing due to population issue
      // This could happen if the template was deleted
      const originalReview = await Review.findById(req.params.id);
      if (originalReview && originalReview.templateId) {
        console.log(`Original review has templateId: ${originalReview.templateId}`);
        
        try {
          // Check if template exists
          const template = await ReviewTemplate.findById(originalReview.templateId);
          if (template) {
            review.templateId = template;
            console.log(`Successfully populated templateId: ${template.name} (${template._id})`);
          } else {
            console.warn(`Template with ID ${originalReview.templateId} no longer exists`);
            // Set a flag to indicate template is missing but was referenced
            review._templateMissing = true;
          }
        } catch (error) {
          console.error('Error checking template existence:', error);
          review._templateMissing = true;
        }
      }
    }
    
    // Check if the user is authorized to view this review
    const isAdminOrManager = req.user.role.name === 'Admin' || req.user.role.name === 'Manager';
    const isReviewer = review.reviewer && review.reviewer._id && review.reviewer._id.toString() === req.user.id;
    const isReviewee = review.reviewee && review.reviewee._id && review.reviewee._id.toString() === req.user.id;
    
    if (!isAdminOrManager && !isReviewer && (!isReviewee || !review.visibleToReviewee)) {
      return res.status(403).json({ msg: 'Not authorized to view this review' });
    }
    
    // Apply anonymity rules
    if (!isAdminOrManager && isReviewee && review.isAnonymous) {
      review.reviewer = { name: 'Anonymous', email: 'anonymous@example.com' };
    }
    
    res.json(review);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Review not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   POST api/reviews/cycles/:id/advance
// @desc    Advance a review cycle to the next phase
// @access  Private - Manager or Admin
router.post('/cycles/:id/advance', managerAndAbove, async (req, res) => {
  try {
    const cycle = await ReviewCycle.findById(req.params.id);
    
    if (!cycle) {
      return res.status(404).json({ msg: 'Review cycle not found' });
    }
    
    // Determine next phase based on current phase
    let nextPhase;
    switch (cycle.status) {
      case 'planning':
        nextPhase = 'self';
        break;
      case 'self':
        nextPhase = 'peer';
        break;
      case 'peer':
        nextPhase = 'manager';
        break;
      case 'manager':
        nextPhase = 'upward';
        break;
      case 'upward':
        nextPhase = 'calibration';
        break;
      case 'calibration':
        nextPhase = 'completed';
        break;
      case 'completed':
        return res.status(400).json({ msg: 'Cycle is already completed' });
      default:
        return res.status(400).json({ msg: 'Invalid cycle status' });
    }
    
    // Update cycle status
    cycle.status = nextPhase;
    await cycle.save();
    
    res.json({ 
      msg: `Cycle advanced to ${nextPhase} phase`,
      cycle
    });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Review cycle not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   POST api/reviews/:id/calibrate
// @desc    Calibrate a submitted review (add notes, adjust ratings)
// @access  Private - Admin and Manager only
router.post('/:id/calibrate', managerAndAbove, async (req, res) => {
  try {
    const { overallRating, calibrationNotes } = req.body;
    
    const review = await Review.findById(req.params.id);
    
    if (!review) {
      return res.status(404).json({ msg: 'Review not found' });
    }
    
    // Check if review is submitted
    if (review.status !== 'submitted') {
      return res.status(400).json({ msg: 'Only submitted reviews can be calibrated' });
    }
    
    // Check if cycle is in calibration phase
    const cycle = await ReviewCycle.findById(review.cycleId);
    if (cycle.status !== 'calibration') {
      return res.status(400).json({ msg: 'Calibration is only available during the calibration phase' });
    }
    
    // Update review
    if (overallRating) review.overallRating = overallRating;
    if (calibrationNotes) review.calibrationNotes = calibrationNotes;
    
    review.status = 'calibrated';
    
    await review.save();
    
    res.json(review);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Review not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   GET api/reviews/:id/export
// @desc    Export a single review as PDF
// @access  Private
router.get('/:id/export', auth, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id)
      .populate('cycleId', 'name startDate endDate')
      .populate('reviewer', 'name email')
      .populate('reviewee', 'name email')
      .populate('templateId', 'name questions');
    
    if (!review) {
      return res.status(404).json({ msg: 'Review not found' });
    }
    
    // Security check - managers can access their team's reviews, admins can access all
    let authorized = false;
    
    // Admin can access any review
    if (req.user.role.name === 'Admin') {
      authorized = true;
    }
    // Manager can access reviews of their direct reports or their own
    else if (req.user.role.name === 'Manager') {
      // Get all users who report to this manager
      const teamMembers = await User.find({ managerId: req.user.id }).select('_id');
      const teamMemberIds = teamMembers.map(member => member._id.toString());
      
      // Check if the review involves the manager or their team members
      authorized = teamMemberIds.includes(review.reviewer.toString()) || 
                  teamMemberIds.includes(review.reviewee.toString()) ||
                  req.user.id === review.reviewer.toString() || 
                  req.user.id === review.reviewee.toString();
    }
    // Regular employee can only access their own reviews
    else {
      authorized = req.user.id === review.reviewer.toString() || 
                  req.user.id === review.reviewee.toString();
    }
    
    if (!authorized) {
      return res.status(403).json({ msg: 'Not authorized to export this review' });
    }
    
    // Create PDF document
    const doc = new PDFDocument();
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=review-${review._id}.pdf`);
    
    // Pipe PDF to response
    doc.pipe(res);
    
    // Add content to PDF
    doc.fontSize(20).text('Performance Review', { align: 'center' });
    doc.moveDown();
    
    doc.fontSize(14).text(`Cycle: ${review.cycleId.name}`);
    doc.fontSize(14).text(`Type: ${review.type.toUpperCase()}`);
    
    // Handle anonymity
    if (review.isAnonymous && 
        req.user.id === review.reviewee.toString() && 
        req.user.role.name !== 'Admin') {
      doc.fontSize(14).text(`Reviewer: Anonymous`);
    } else {
      doc.fontSize(14).text(`Reviewer: ${review.reviewer.name} (${review.reviewer.email})`);
    }
    
    doc.fontSize(14).text(`Reviewee: ${review.reviewee.name} (${review.reviewee.email})`);
    doc.fontSize(14).text(`Status: ${review.status.toUpperCase()}`);
    
    if (review.submittedAt) {
      doc.fontSize(14).text(`Submitted: ${new Date(review.submittedAt).toLocaleDateString()}`);
    }
    
    doc.moveDown();
    
    // Display legacy content if present
    if (review.content) {
      doc.fontSize(16).text('Review Content', { underline: true });
      doc.fontSize(12).text(review.content);
      doc.moveDown();
    }
    
    // Display structured answers if present
    if (review.answers && review.answers.length > 0) {
      doc.fontSize(16).text('Responses', { underline: true });
      doc.moveDown();
      
      // Fetch question text from template if available
      const questionTexts = {};
      if (review.templateId && review.templateId.questions) {
        review.templateId.questions.forEach(q => {
          questionTexts[q._id.toString()] = q.text;
        });
      }
      
      review.answers.forEach((answer, i) => {
        // Display question text if available, otherwise just the question number
        const questionText = questionTexts[answer.questionId.toString()] || `Question ${i+1}`;
        doc.fontSize(12).text(questionText, { bold: true });
        
        if (answer.type === 'rating' && answer.ratingValue) {
          doc.fontSize(12).text(`Rating: ${answer.ratingValue}/5`);
        } else if (answer.type === 'open-ended' && answer.textValue) {
          doc.fontSize(12).text(`Response: ${answer.textValue}`);
        } else if (answer.type === 'multiple-choice' && answer.selectedOptions) {
          doc.fontSize(12).text(`Selected: ${answer.selectedOptions.join(', ')}`);
        }
        
        doc.moveDown();
      });
    }
      // Add legacy ratings if they exist
    if (review.ratings) {
      doc.fontSize(16).text('Ratings', { underline: true });
      
      try {
        // Check if ratings is a Map or an Object
        if (review.ratings instanceof Map) {
          for (const [category, rating] of review.ratings.entries()) {
            doc.fontSize(12).text(`${category}: ${rating}/5`);
          }
          
          // Calculate average rating from Map
          const ratings = Array.from(review.ratings.values());
          const average = ratings.length > 0 
            ? ratings.reduce((sum, val) => sum + val, 0) / ratings.length 
            : 0;
          
          doc.moveDown();
          doc.fontSize(14).text(`Average Rating: ${average.toFixed(1)}/5`);
        } else if (typeof review.ratings === 'object' && review.ratings !== null) {
          // Handle as regular object
          Object.entries(review.ratings).forEach(([category, rating]) => {
            doc.fontSize(12).text(`${category}: ${rating}/5`);
          });
          
          // Calculate average rating
          const ratings = Object.values(review.ratings);
          const average = ratings.length > 0 
            ? ratings.reduce((sum, val) => sum + val, 0) / ratings.length 
            : 0;
          
          doc.moveDown();
          doc.fontSize(14).text(`Average Rating: ${average.toFixed(1)}/5`);
        } else {
          doc.fontSize(12).text('Ratings data format not recognized');
        }
      } catch (error) {
        console.error('Error formatting ratings:', error);
        doc.fontSize(12).text('Error displaying ratings data');
      }
    }
    
    // Add overall rating if present
    if (review.overallRating) {
      doc.moveDown();
      doc.fontSize(16).text('Overall Assessment', { underline: true });
      doc.fontSize(14).text(`Overall Rating: ${review.overallRating}/5`);
    }
    
    // Add summary feedback if present
    if (review.summaryFeedback) {
      doc.moveDown();
      doc.fontSize(16).text('Summary Feedback', { underline: true });
      doc.fontSize(12).text(review.summaryFeedback);
    }
    
    // Add calibration notes if present and user is authorized
    if (review.calibrationNotes && (req.user.role.name === 'Admin' || req.user.role.name === 'Manager')) {
      doc.moveDown();
      doc.fontSize(16).text('Calibration Notes', { underline: true });
      doc.fontSize(12).text(review.calibrationNotes);
    }
    
    // Finalize PDF
    doc.end();
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {      return res.status(404).json({ msg: 'Review not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   POST api/reviews/cycles/:id/configure-phases
// @desc    Configure phases for a review cycle
// @access  Private - Admin only
router.post('/cycles/:id/configure-phases', adminOnly, async (req, res) => {
  try {
    const { phases } = req.body;
    if (!phases || !Array.isArray(phases)) {
      return res.status(400).json({ msg: 'Phases configuration is required' });
    }
    
    const cycle = await ReviewCycle.findById(req.params.id);
    if (!cycle) {
      return res.status(404).json({ msg: 'Review cycle not found' });
    }
    
    cycle.phases = phases;
    await cycle.save();
    
    res.json(cycle);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/reviews/cycles/:id/start
// @desc    Start a review cycle (move from planning to first active phase)
// @access  Private - Admin only
router.post('/cycles/:id/start', adminOnly, async (req, res) => {
  try {
    const cycle = await WorkflowService.startCycle(req.params.id);
    res.json(cycle);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/reviews/cycles/:id/advance-phase
// @desc    Manually advance a cycle to the next phase
// @access  Private - Admin only
router.post('/cycles/:id/advance-phase', adminOnly, async (req, res) => {
  try {
    const cycle = await ReviewCycle.findById(req.params.id);
    if (!cycle) {
      return res.status(404).json({ msg: 'Review cycle not found' });
    }
    
    const advanced = cycle.advanceToNextPhase();
    if (advanced) {
      cycle.status = cycle.currentPhase;
      await cycle.save();
      
      // Assign reviews for the new phase
      await ReviewAssignmentService.assignReviewsForPhase(cycle._id, cycle.currentPhase);
      
      res.json(cycle);
    } else {
      res.status(400).json({ msg: 'Cannot advance cycle - already in final phase' });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/reviews/assign-auto
// @desc    Automatically assign reviews based on org chart
// @access  Private - Admin only
router.post('/assign-auto', adminOnly, async (req, res) => {
  try {
    const { cycleId, phase } = req.body;
    
    if (!cycleId) {
      return res.status(400).json({ msg: 'Cycle ID is required' });
    }
    
    if (!phase) {
      return res.status(400).json({ msg: 'Phase is required' });
    }
    
    await ReviewAssignmentService.assignReviewsForPhase(cycleId, phase);
    
    res.json({ msg: `Reviews for phase ${phase} assigned successfully` });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/reviews/reports/:userId
// @desc    Get reviews for direct and indirect reports
// @access  Private - Manager and above
router.get('/reports/:userId', managerAndAbove, async (req, res) => {
  try {
    // Get all reports (direct and indirect)
    const allReports = await User.getAllReports(req.params.userId);
    const reportIds = allReports.map(user => user._id);
    
    // Get all reviews for these reports
    const reviews = await Review.find({
      reviewee: { $in: reportIds }
    }).populate('reviewer reviewee');
    
    res.json(reviews);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/reviews/process-workflows
// @desc    Process all active workflows (for scheduled job)
// @access  Private - Admin only
router.post('/process-workflows', adminOnly, async (req, res) => {
  try {
    await WorkflowService.processWorkflows();
    res.json({ msg: 'Workflows processed successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/reviews/:id/recalculate-sentiment
// @desc    Recalculate sentiment for a review (debug route)
// @access  Private
router.post('/:id/recalculate-sentiment', async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    
    if (!review) {
      return res.status(404).json({ msg: 'Review not found' });
    }
    
    // Debug info
    console.log('Recalculating sentiment for review:', review._id);
    console.log('Review status:', review.status);
    console.log('Has answers:', review.answers && review.answers.length > 0);
    console.log('Answer count:', review.answers ? review.answers.length : 0);
    
    // If there are no answers but there is content (legacy format), create a synthetic answer
    if ((!review.answers || review.answers.length === 0) && review.content) {
      console.log('No structured answers found, but legacy content exists. Creating synthetic answer.');
      review.answers = [{
        questionId: new mongoose.Types.ObjectId(),
        type: 'open-ended',
        textValue: review.content
      }];
    }
    
    // If there are summaryFeedback but no answers, create a synthetic answer
    if ((!review.answers || review.answers.length === 0) && review.summaryFeedback) {
      console.log('No answers found, but summaryFeedback exists. Creating synthetic answer.');
      review.answers = [{
        questionId: new mongoose.Types.ObjectId(),
        type: 'open-ended',
        textValue: review.summaryFeedback
      }];
    }
    
    // If we have answers with text, analyze them
    if (review.answers && review.answers.length > 0 && 
        review.answers.some(a => a.textValue && a.textValue.trim() !== '')) {
      console.log('Found text answers to analyze');
      const SentimentService = require('../services/SentimentService');
      try {
        const analyzedReview = await SentimentService.analyzeReview(review);
        console.log(`Sentiment analysis complete. Overall sentiment: ${analyzedReview.overallSentimentLabel}`);
        await analyzedReview.save();
        res.json(analyzedReview);
      } catch (sentimentError) {
        console.error('Error performing sentiment analysis:', sentimentError);
        res.status(500).json({ msg: 'Error performing sentiment analysis', error: sentimentError.message });
      }
    } else {
      res.status(400).json({ 
        msg: 'Review has no text content to analyze',
        reviewInfo: {
          id: review._id,
          status: review.status,
          answerCount: review.answers ? review.answers.length : 0,
          hasContent: !!review.content,
          hasSummaryFeedback: !!review.summaryFeedback
        }
      });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/reviews/:id/sentiment-comparison
// @desc    Compare sentiment across different reviews for the same person
// @access  Private
router.get('/:id/sentiment-comparison', async (req, res) => {
  try {
    const review = await Review.findById(req.params.id)
      .populate('reviewee')
      .populate('cycleId');
    
    if (!review) {
      return res.status(404).json({ msg: 'Review not found' });
    }
    
    // Use the review to get the reviewee and cycle
    const revieweeId = review.reviewee._id;
    const cycleId = review.cycleId._id;
    
    const SentimentService = require('../services/SentimentService');
    const comparison = await SentimentService.compareReviewSentiment(revieweeId, cycleId);
    
    res.json(comparison);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
