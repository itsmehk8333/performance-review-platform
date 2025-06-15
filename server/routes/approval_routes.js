// Approval routes to add to the reviews.js file

// @route   POST api/reviews/:id/approve
// @desc    Approve a review
// @access  Private - Manager and above
router.post('/:id/approve', managerAndAbove, async (req, res) => {
  try {
    const review = await ApprovalService.approveReview(req.params.id, req.user.id);
    res.json(review);
  } catch (err) {
    console.error(err.message);
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
    
    const review = await ApprovalService.rejectReview(req.params.id, req.user.id, rejectionReason);
    res.json(review);
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
    let pendingReviews;
    
    // If admin, get all pending approvals
    if (req.user.role === 'Admin') {
      pendingReviews = await ApprovalService.getAllPendingApprovals();
    } else {
      // Otherwise get only approvals for direct reports
      pendingReviews = await ApprovalService.getPendingApprovals(req.user.id);
    }
    
    res.json(pendingReviews);
  } catch (err) {
    console.error(err.message);
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
