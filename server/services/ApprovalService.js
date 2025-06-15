const Review = require('../models/Review');
const User = require('../models/User');

/**
 * Service for managing the review approval workflow
 */
class ApprovalService {
  /**
   * Approve a review
   * @param {string} reviewId - The ID of the review to approve
   * @param {string} approverId - The ID of the user approving the review
   */  static async approveReview(reviewId, approverId) {
    try {
      const review = await Review.findById(reviewId);
      if (!review) {
        throw new Error('Review not found');
      }
        console.log(`Approving review ${reviewId} - Current status: ${review.status}, approval status: ${review.approvalStatus}`);
      
      // Check if review is in submitted state or has pending approval status
      // This allows approving reviews with status='submitted' OR approvalStatus='pending'
      if (review.status !== 'submitted' && review.approvalStatus !== 'pending') {
        console.error(`Cannot approve review ${reviewId} - Status is ${review.status}, approvalStatus is ${review.approvalStatus}`);
        throw new Error(`Only submitted reviews can be approved. Current status: ${review.status}, approval status: ${review.approvalStatus}`);
      }
      
      // Get the approver
      const approver = await User.findById(approverId).populate('role');
      if (!approver) {
        throw new Error('Approver not found');
      }
      
      console.log(`Approver ${approverId} role: ${approver.role ? approver.role.name : 'Unknown'}`);
      
      // Check if approver has permission (must be manager or admin)
      if (approver.role.name !== 'Admin' && approver.role.name !== 'Manager') {
        throw new Error('Not authorized to approve reviews');
      }
      
      // Update review
      review.approvalStatus = 'approved';
      review.approvedBy = approverId;
      review.approvedAt = new Date();
      review.status = 'approved';
      
      await review.save();
      console.log(`Review ${reviewId} successfully approved`);
      return review;
    } catch (error) {
      console.error('Error approving review:', error);
      throw error;
    }
  }
  
  /**
   * Reject a review
   * @param {string} reviewId - The ID of the review to reject
   * @param {string} approverId - The ID of the user rejecting the review
   * @param {string} rejectionReason - The reason for rejection
   */
  static async rejectReview(reviewId, approverId, rejectionReason) {
    try {
      if (!rejectionReason) {
        throw new Error('Rejection reason is required');
      }
      
      const review = await Review.findById(reviewId);
      if (!review) {
        throw new Error('Review not found');
      }
        // Check if review is in submitted state or has pending approval status
      // This allows rejecting reviews with status='submitted' OR approvalStatus='pending'
      console.log(`Rejecting review ${reviewId} - Current status: ${review.status}, approval status: ${review.approvalStatus}`);
      
      if (review.status !== 'submitted' && review.approvalStatus !== 'pending') {
        console.error(`Cannot reject review ${reviewId} - Status is ${review.status}, approvalStatus is ${review.approvalStatus}`);
        throw new Error(`Only submitted reviews can be rejected. Current status: ${review.status}, approval status: ${review.approvalStatus}`);
      }
      
      // Get the approver
      const approver = await User.findById(approverId).populate('role');
      if (!approver) {
        throw new Error('Approver not found');
      }
      
      // Check if approver has permission (must be manager or admin)
      if (approver.role.name !== 'Admin' && approver.role.name !== 'Manager') {
        throw new Error('Not authorized to reject reviews');
      }
      
      // Update review
      review.approvalStatus = 'rejected';
      review.rejectionReason = rejectionReason;
      review.status = 'rejected';
      
      await review.save();
      return review;
    } catch (error) {
      console.error('Error rejecting review:', error);
      throw error;
    }
  }
  
  /**
   * Get reviews pending approval for a manager
   * @param {string} managerId - The ID of the manager
   */  static async getPendingApprovals(managerId) {
    try {
      // Get all direct reports for this manager
      const directReports = await User.find({ managerId });
      console.log(`Manager ${managerId} has ${directReports.length} direct reports`);
      
      // If no direct reports, return all reviews where this manager is assigned as reviewer
      if (directReports.length === 0) {
        console.log('No direct reports found, using manager reviews');
        return await Review.find({
          status: 'submitted',
          approvalStatus: 'pending',
          type: 'manager',
          reviewer: managerId
        }).populate('reviewer reviewee');
      }
      
      const directReportIds = directReports.map(user => user._id);
      console.log('Direct report IDs:', directReportIds);
      
      // Get reviews that need approval
      const pendingReviews = await Review.find({
        status: 'submitted',
        approvalStatus: 'pending',
        reviewee: { $in: directReportIds }
      }).populate('reviewer reviewee');
      
      console.log(`Found ${pendingReviews.length} pending reviews for manager ${managerId}`);
      return pendingReviews;
    } catch (error) {
      console.error('Error getting pending approvals:', error);
      throw error;
    }
  }
  
  /**
   * Get all reviews pending approval (for admins)
   */  static async getAllPendingApprovals() {
    try {
      // Get all reviews that need approval
      const pendingReviews = await Review.find({
        status: 'submitted',
        approvalStatus: 'pending'
      }).populate('reviewer reviewee');
      
      console.log(`Found ${pendingReviews.length} total pending reviews for admin`);
      return pendingReviews;
    } catch (error) {
      console.error('Error getting all pending approvals:', error);
      throw error;
    }
  }
}

module.exports = ApprovalService;
