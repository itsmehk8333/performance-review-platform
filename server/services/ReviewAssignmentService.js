const User = require('../models/User');
const Review = require('../models/Review');
const ReviewCycle = require('../models/ReviewCycle');

/**
 * Helper functions for automatic review assignment based on org chart
 */
class ReviewAssignmentService {
  /**
   * Assign reviews for a specific cycle and phase
   * @param {string} cycleId - The ID of the review cycle
   * @param {string} phase - The phase to assign reviews for (self, peer, manager, upward)
   */
  static async assignReviewsForPhase(cycleId, phase) {
    try {
      const cycle = await ReviewCycle.findById(cycleId);
      if (!cycle) {
        throw new Error('Review cycle not found');
      }
      
      // Check if this phase is enabled in the cycle
      if (!cycle.reviewTypes[phase] && phase !== 'planning' && phase !== 'calibration' && phase !== 'completed') {
        console.log(`Phase ${phase} is not enabled for this cycle. Skipping assignments.`);
        return;
      }
      
      const participants = await User.find({ _id: { $in: cycle.participants } }).populate('role');
      
      // Different assignment logic based on phase
      switch (phase) {
        case 'self':
          await this.assignSelfReviews(cycle, participants);
          break;
        case 'peer':
          await this.assignPeerReviews(cycle, participants);
          break;
        case 'manager':
          await this.assignManagerReviews(cycle, participants);
          break;
        case 'upward':
          await this.assignUpwardReviews(cycle, participants);
          break;
        default:
          console.log(`No assignment needed for phase ${phase}`);
      }
      
      console.log(`Successfully assigned reviews for phase ${phase} in cycle ${cycle.name}`);
      return true;
    } catch (error) {
      console.error('Error assigning reviews:', error);
      throw error;
    }
  }
  
  /**
   * Assign self reviews
   * @param {Object} cycle - The review cycle object
   * @param {Array} participants - Array of user objects
   */
  static async assignSelfReviews(cycle, participants) {
    const reviews = [];
    
    for (const user of participants) {
      // Check if a self-review already exists for this user in this cycle
      const existingReview = await Review.findOne({
        cycleId: cycle._id,
        reviewee: user._id,
        reviewer: user._id,
        type: 'self'
      });
      
      if (!existingReview) {
        reviews.push({
          cycleId: cycle._id,
          templateId: cycle.templateId,
          reviewer: user._id,
          reviewee: user._id,
          type: 'self',
          status: 'pending'
        });
      }
    }
    
    if (reviews.length > 0) {
      await Review.insertMany(reviews);
      console.log(`Created ${reviews.length} new self reviews`);
    }
  }
  
  /**
   * Assign peer reviews
   * @param {Object} cycle - The review cycle object
   * @param {Array} participants - Array of user objects
   */
  static async assignPeerReviews(cycle, participants) {
    const reviews = [];
    const peersPerUser = 3; // Number of peer reviews to assign per user
    
    for (const reviewee of participants) {
      // Get all teammates (users with the same manager)
      let teammates = [];
      if (reviewee.managerId) {
        teammates = await User.find({ 
          managerId: reviewee.managerId,
          _id: { $ne: reviewee._id }
        });
      }
      
      // If not enough teammates, get users from same department
      if (teammates.length < peersPerUser && reviewee.department) {
        const deptPeers = await User.find({
          department: reviewee.department,
          _id: { $ne: reviewee._id },
          _id: { $nin: teammates.map(t => t._id) }
        }).limit(peersPerUser - teammates.length);
        
        teammates = [...teammates, ...deptPeers];
      }
      
      // If still not enough, get random participants
      if (teammates.length < peersPerUser) {
        const randomPeers = participants
          .filter(p => 
            p._id.toString() !== reviewee._id.toString() && 
            !teammates.some(t => t._id.toString() === p._id.toString())
          )
          .slice(0, peersPerUser - teammates.length);
        
        teammates = [...teammates, ...randomPeers];
      }
      
      // Limit to maximum number of peers
      teammates = teammates.slice(0, peersPerUser);
      
      // Create peer reviews
      for (const peer of teammates) {
        // Check if a peer review already exists
        const existingReview = await Review.findOne({
          cycleId: cycle._id,
          reviewee: reviewee._id,
          reviewer: peer._id,
          type: 'peer'
        });
        
        if (!existingReview) {
          reviews.push({
            cycleId: cycle._id,
            templateId: cycle.templateId,
            reviewer: peer._id,
            reviewee: reviewee._id,
            type: 'peer',
            status: 'pending',
            isAnonymous: cycle.anonymitySettings.peerReviews === 'full'
          });
        }
      }
    }
    
    if (reviews.length > 0) {
      await Review.insertMany(reviews);
      console.log(`Created ${reviews.length} new peer reviews`);
    }
  }
  
  /**
   * Assign manager reviews
   * @param {Object} cycle - The review cycle object
   * @param {Array} participants - Array of user objects
   */
  static async assignManagerReviews(cycle, participants) {
    const reviews = [];
    
    for (const reviewee of participants) {
      // Skip if user has no manager
      if (!reviewee.managerId) continue;
      
      // Get the manager
      const manager = await User.findById(reviewee.managerId);
      if (!manager) continue;
      
      // Check if a manager review already exists
      const existingReview = await Review.findOne({
        cycleId: cycle._id,
        reviewee: reviewee._id,
        reviewer: manager._id,
        type: 'manager'
      });
      
      if (!existingReview) {
        reviews.push({
          cycleId: cycle._id,
          templateId: cycle.templateId,
          reviewer: manager._id,
          reviewee: reviewee._id,
          type: 'manager',
          status: 'pending'
        });
      }
    }
    
    if (reviews.length > 0) {
      await Review.insertMany(reviews);
      console.log(`Created ${reviews.length} new manager reviews`);
    }
  }
  
  /**
   * Assign upward reviews
   * @param {Object} cycle - The review cycle object
   * @param {Array} participants - Array of user objects
   */
  static async assignUpwardReviews(cycle, participants) {
    const reviews = [];
    
    for (const reviewer of participants) {
      // Skip if user has no manager
      if (!reviewer.managerId) continue;
      
      // Get the manager
      const manager = await User.findById(reviewer.managerId);
      if (!manager) continue;
      
      // Check if an upward review already exists
      const existingReview = await Review.findOne({
        cycleId: cycle._id,
        reviewee: manager._id,
        reviewer: reviewer._id,
        type: 'upward'
      });
      
      if (!existingReview) {
        reviews.push({
          cycleId: cycle._id,
          templateId: cycle.templateId,
          reviewer: reviewer._id,
          reviewee: manager._id,
          type: 'upward',
          status: 'pending',
          isAnonymous: cycle.anonymitySettings.upwardReviews === 'full'
        });
      }
    }
    
    if (reviews.length > 0) {
      await Review.insertMany(reviews);
      console.log(`Created ${reviews.length} new upward reviews`);
    }
  }
}

module.exports = ReviewAssignmentService;
