const ReviewCycle = require('../models/ReviewCycle');
const Review = require('../models/Review');
const User = require('../models/User');
const ReviewAssignmentService = require('./ReviewAssignmentService');

/**
 * Service for managing review workflow, phases, and reminders
 */
class WorkflowService {
  /**
   * Check and process cycle phase transitions
   * This should be run on a schedule (e.g., daily)
   */
  static async processWorkflows() {
    try {
      // Get all active cycles (not in planning or completed)
      const activeCycles = await ReviewCycle.find({
        status: { $nin: ['planning', 'completed'] }
      });
      
      console.log(`Processing workflows for ${activeCycles.length} active review cycles`);
      
      for (const cycle of activeCycles) {
        await this.processCycleWorkflow(cycle);
      }
      
      return true;
    } catch (error) {
      console.error('Error processing workflows:', error);
      throw error;
    }
  }
  
  /**
   * Process workflow for a specific cycle
   * @param {Object} cycle - The review cycle object
   */
  static async processCycleWorkflow(cycle) {
    try {
      // Get current phase
      const currentPhase = cycle.getCurrentPhaseObject();
      
      // If no current phase, something is wrong
      if (!currentPhase) {
        console.error(`Cycle ${cycle._id} has no current phase`);
        return;
      }
      
      // Check if phase end date has passed
      const now = new Date();
      const phaseEndDate = new Date(currentPhase.endDate);
      
      if (now > phaseEndDate) {
        console.log(`Phase ${cycle.currentPhase} for cycle ${cycle.name} has ended`);
        
        // If auto-advance is enabled, move to next phase
        if (cycle.autoAdvancePhases) {
          const advanced = cycle.advanceToNextPhase();
          if (advanced) {
            cycle.status = cycle.currentPhase;
            await cycle.save();
            
            // Assign reviews for the new phase
            await ReviewAssignmentService.assignReviewsForPhase(cycle._id, cycle.currentPhase);
            
            console.log(`Automatically advanced cycle ${cycle.name} to phase ${cycle.currentPhase}`);
          }
        } else {
          // Mark phase as complete but don't advance
          currentPhase.isComplete = true;
          await cycle.save();
        }
      } else {
        // Phase is still active, check if reminders need to be sent
        await this.processReminders(cycle, currentPhase);
      }
    } catch (error) {
      console.error(`Error processing workflow for cycle ${cycle._id}:`, error);
      throw error;
    }
  }
  
  /**
   * Process reminders for a cycle phase
   * @param {Object} cycle - The review cycle object
   * @param {Object} phase - The current phase object
   */
  static async processReminders(cycle, phase) {
    try {
      // Skip if reminders are disabled
      if (!cycle.reminderSettings.enabled) return;
      
      const now = new Date();
      const reminderFrequency = cycle.reminderSettings.frequency * 24 * 60 * 60 * 1000; // Convert days to ms
      
      // Get all pending reviews for this cycle and phase
      const pendingReviews = await Review.find({
        cycleId: cycle._id,
        status: { $in: ['pending', 'in_progress'] },
        // For self phase, only get self reviews. For other phases, get the appropriate type
        type: cycle.currentPhase === 'self' ? 'self' : cycle.currentPhase === 'peer' ? 'peer' : 
              cycle.currentPhase === 'manager' ? 'manager' : cycle.currentPhase === 'upward' ? 'upward' : { $exists: true }
      }).populate('reviewer reviewee');
      
      console.log(`Found ${pendingReviews.length} pending reviews for phase ${cycle.currentPhase}`);
      
      // Process each pending review
      for (const review of pendingReviews) {
        // Check if reminder is due
        const lastReminder = review.lastReminderSent ? new Date(review.lastReminderSent) : null;
        
        if (!lastReminder || (now - lastReminder > reminderFrequency)) {
          // Send reminder (this would call an email service in a real implementation)
          console.log(`Sending reminder for review ${review._id} to ${review.reviewer.email}`);
          
          // Update reminder tracking fields
          review.lastReminderSent = now;
          review.reminderCount += 1;
          await review.save();
          
          // Check if escalation to manager is needed
          if (cycle.reminderSettings.escalateToManager && 
              review.reminderCount >= 3 && 
              review.reviewer.managerId) {
            
            // Notify the reviewer's manager
            const manager = await User.findById(review.reviewer.managerId);
            if (manager) {
              console.log(`Escalating reminder for review ${review._id} to manager ${manager.email}`);
              // In a real implementation, this would send an email to the manager
            }
          }
        }
      }
    } catch (error) {
      console.error(`Error processing reminders for cycle ${cycle._id}:`, error);
      throw error;
    }
  }
  
  /**
   * Create a new review cycle with phases
   * @param {Object} cycleData - Basic cycle data
   * @param {Array} phaseData - Array of phase configurations
   */
  static async createCycleWithPhases(cycleData, phaseData) {
    try {
      // Create base cycle
      const cycle = new ReviewCycle({
        ...cycleData,
        phases: phaseData || [],
        currentPhase: 'planning',
        status: 'planning'
      });
      
      await cycle.save();
      return cycle;
    } catch (error) {
      console.error('Error creating cycle with phases:', error);
      throw error;
    }
  }
  
  /**
   * Start a review cycle (transition from planning to first active phase)
   * @param {string} cycleId - The ID of the cycle to start
   */
  static async startCycle(cycleId) {
    try {
      const cycle = await ReviewCycle.findById(cycleId);
      if (!cycle) {
        throw new Error('Review cycle not found');
      }
      
      if (cycle.status !== 'planning') {
        throw new Error('Cycle has already been started');
      }
      
      // Default phase order if not specified in phases
      const phaseOrder = ['self', 'peer', 'manager', 'upward', 'calibration', 'completed'];
      
      // Find first enabled phase
      let firstPhase = null;
      for (const phase of phaseOrder) {
        if (cycle.reviewTypes[phase] || phase === 'calibration') {
          firstPhase = phase;
          break;
        }
      }
      
      if (!firstPhase) {
        throw new Error('No valid phases configured for this cycle');
      }
      
      // Update cycle status and current phase
      cycle.status = firstPhase;
      cycle.currentPhase = firstPhase;
      await cycle.save();
      
      // Assign reviews for the first phase
      await ReviewAssignmentService.assignReviewsForPhase(cycleId, firstPhase);
      
      return cycle;
    } catch (error) {
      console.error('Error starting cycle:', error);
      throw error;
    }
  }
}

module.exports = WorkflowService;
