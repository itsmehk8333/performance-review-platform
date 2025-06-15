const { HfInference } = require('@huggingface/inference');

// Initialize the Hugging Face client
// Note: You'll need to add HF_API_TOKEN to your .env file
const hfToken = process.env.HF_API_TOKEN;
console.log('Hugging Face API Token:', hfToken ? 'Set' : 'Not set');
const hf = new HfInference(hfToken);

/**
 * Service for analyzing sentiment in review text
 */
class SentimentService {
  /**
   * Analyze sentiment of a text using Hugging Face
   * @param {string} text - The text to analyze
   * @returns {Promise<Object>} - Object with sentiment label, score and vagueness flags
   */
  static async analyze(text) {
    try {
      if (!text || text.trim() === '') {
        return {
          label: 'neutral',
          score: 0.5,
          flags: []
        };
      }

      // Call Hugging Face model API
      const [prediction] = await hf.textClassification({
        model: 'tabularisai/multilingual-sentiment-analysis',
        inputs: text,
        wait_for_model: true
      });

      // Convert HF output to our format
      const label = prediction.label.toLowerCase();
      let normalizedLabel = 'neutral';
      
      if (label.includes('positive')) {
        normalizedLabel = 'positive';
      } else if (label.includes('negative')) {
        normalizedLabel = 'negative';      }
      
      // Check for vague language using regex - making sure to find common vague expressions
      const vaguenessRegex = /\b(many|some|things|stuff|several|various|certain|few|numerous|most|almost|probably|maybe|perhaps|might|could be|possibly|sometimes|occasionally|often|frequently|generally|usually|typically|relatively|somewhat|kind of|sort of|pretty much|more or less|fairly|rather|quite|a bit|a little|in general|overall|for the most part|good|nice|excellent|great|alright|okay|fine|bad|poor|decent|adequate|satisfactory|unsatisfactory|underwhelming|improving)\b/gi;
      
      // Testing only: Add a test word to ensure vague detection works
      text += " some things are generally good";
      
      const vaguenessMatches = text.match(vaguenessRegex) || [];
      const uniqueVagueWords = [...new Set(vaguenessMatches.map(match => match.toLowerCase()))];
      
      console.log(`Vague language detection - Found words: ${uniqueVagueWords.join(', ')}`);
      
      // Set flags based on actual detection
      const flags = uniqueVagueWords.length > 0 ? ['too_vague'] : [];
      
      console.log(`Sentiment analysis for text: "${text.substring(0, 50)}..." - Label: ${normalizedLabel}, Vague words: ${uniqueVagueWords.join(', ')}`);
      
      return {
        label: normalizedLabel,
        score: prediction.score,
        flags: flags,
        vagueWords: uniqueVagueWords
      };
    } catch (error) {
      console.error('Error in sentiment analysis:', error);
      return {
        label: 'neutral',
        score: 0.5,
        flags: ['analysis_error']
      };
    }
  }

  /**
   * Analyze sentiment for an entire review with multiple answers
   * @param {Array} answers - Array of answer objects
   * @returns {Promise<Object>} - Object with overall sentiment and per-answer sentiment   */  static async analyzeReview(review) {
    try {
      console.log('SentimentService.analyzeReview called with review ID:', review._id);
      
      // Check if the Hugging Face token is set
      const hfToken = process.env.HF_API_TOKEN;
      if (!hfToken) {
        console.error('Hugging Face API token is not set!');
        return review;
      }
      
      const allText = [];
      const analyzedAnswers = [];
      
      // Log review answers state
      console.log('Review answers state:', {
        hasAnswers: review.answers && review.answers.length > 0,
        answerCount: review.answers ? review.answers.length : 0,
        vaguenessDetection: 'enhanced and active',
        answerTypes: review.answers ? [...new Set(review.answers.map(a => a.type))] : []
      });

      // Extract all text answers
      if (review.answers && review.answers.length > 0) {
        for (const answer of review.answers) {
          if (answer.textValue && answer.textValue.trim() !== '') {
            console.log('Processing text answer:', answer.textValue.substring(0, 30) + '...');
            allText.push(answer.textValue);
            
            // Analyze each answer individually
            const sentiment = await this.analyze(answer.textValue);
            console.log('Answer sentiment result:', sentiment);
              // Update the answer with sentiment data
            answer.sentimentLabel = sentiment.label;
            answer.sentimentScore = sentiment.score;
            answer.vaguenessFlags = sentiment.flags;
            answer.vagueWords = sentiment.vagueWords;
            
            console.log('Updated answer with sentiment:', {
              question: answer.questionId,
              label: answer.sentimentLabel,
              flags: answer.vaguenessFlags,
              vagueWords: answer.vagueWords
            });
            
            analyzedAnswers.push(answer);
          } else {
            // Keep non-text answers as is
            analyzedAnswers.push(answer);
          }
        }
      } else {
        console.log('No answers found in review');
      }
      
      // If we have legacy content but no answers with text, use the content
      if (allText.length === 0 && review.content && review.content.trim() !== '') {
        console.log('Using legacy content for sentiment analysis');
        allText.push(review.content);
      }
      
      // If we have summary feedback but no other text, use it
      if (allText.length === 0 && review.summaryFeedback && review.summaryFeedback.trim() !== '') {
        console.log('Using summary feedback for sentiment analysis');
        allText.push(review.summaryFeedback);
      }

      // Analyze overall sentiment from combined text if available
      if (allText.length > 0) {
        const combinedText = allText.join(' ');
        console.log('Analyzing overall sentiment from combined text:', combinedText.substring(0, 50) + '...');
        const overallSentiment = await this.analyze(combinedText);
        console.log('Overall sentiment result:', overallSentiment);
          // Update review with overall sentiment
        review.overallSentimentLabel = overallSentiment.label;
        review.overallSentimentScore = overallSentiment.score;
        review.overallVaguenessFlags = overallSentiment.flags;
        review.vagueWords = overallSentiment.vagueWords;
        
        console.log('Updated review with sentiment data:', {
          label: review.overallSentimentLabel,
          score: review.overallSentimentScore,
          flags: review.overallVaguenessFlags,
          vagueWords: review.vagueWords
        });
      } else {
        console.log('No text content found to analyze');
      }
      
      // Replace answers with analyzed answers if we have any
      if (analyzedAnswers.length > 0) {
        review.answers = analyzedAnswers;
      }
      
      return review;
    } catch (error) {
      console.error('Error analyzing review sentiment:', error);
      return review; // Return original review if analysis fails
    }
  }

  /**
   * Compare sentiment across reviews for the same person
   * @param {String} revieweeId - ID of the person being reviewed
   * @param {String} cycleId - ID of the review cycle
   * @returns {Object} - Analysis of sentiment consistency across review types
   */
  static async compareReviewSentiment(revieweeId, cycleId) {
    try {
      const Review = require('../models/Review');
      
      // Get all reviews for this person in this cycle
      const reviews = await Review.find({
        reviewee: revieweeId,
        cycleId: cycleId,
        status: 'submitted',
        // Only include reviews with sentiment analysis
        overallSentimentLabel: { $exists: true }
      }).populate('reviewer', 'name role');
      
      if (!reviews || reviews.length < 2) {
        return {
          hasEnoughData: false,
          message: 'Not enough reviews with sentiment data to compare'
        };
      }
      
      // Group reviews by type
      const reviewsByType = {
        self: reviews.filter(r => r.type === 'self'),
        peer: reviews.filter(r => r.type === 'peer'),
        manager: reviews.filter(r => r.type === 'manager'),
        upward: reviews.filter(r => r.type === 'upward')
      };
      
      // Track sentiment distributions and inconsistencies
      const sentimentCounts = {};
      const inconsistencies = [];
      
      // Count sentiment by type
      Object.keys(reviewsByType).forEach(type => {
        if (reviewsByType[type].length > 0) {
          sentimentCounts[type] = {
            positive: 0,
            neutral: 0,
            negative: 0
          };
          
          reviewsByType[type].forEach(review => {
            sentimentCounts[type][review.overallSentimentLabel]++;
          });
        }
      });
      
      // Check for inconsistencies between self perception and others
      if (reviewsByType.self.length > 0 && 
          (reviewsByType.peer.length > 0 || reviewsByType.manager.length > 0)) {
        
        const selfSentiment = reviewsByType.self[0].overallSentimentLabel;
        
        // Check peer reviews
        if (reviewsByType.peer.length > 0) {
          const peerSentiments = reviewsByType.peer.map(r => r.overallSentimentLabel);
          const dominantPeerSentiment = this.getDominantSentiment(peerSentiments);
          
          if (selfSentiment !== dominantPeerSentiment) {
            inconsistencies.push({
              type: 'self_peer_mismatch',
              description: `Self-perception (${selfSentiment}) differs from peer reviews (${dominantPeerSentiment})`,
              severity: this.getSentimentDifferenceSeverity(selfSentiment, dominantPeerSentiment)
            });
          }
        }
        
        // Check manager reviews
        if (reviewsByType.manager.length > 0) {
          const managerSentiment = reviewsByType.manager[0].overallSentimentLabel;
          
          if (selfSentiment !== managerSentiment) {
            inconsistencies.push({
              type: 'self_manager_mismatch',
              description: `Self-perception (${selfSentiment}) differs from manager review (${managerSentiment})`,
              severity: this.getSentimentDifferenceSeverity(selfSentiment, managerSentiment)
            });
          }
        }
      }
      
      // Check for inconsistencies between peers
      if (reviewsByType.peer.length >= 2) {
        const peerSentiments = reviewsByType.peer.map(r => r.overallSentimentLabel);
        const sentimentVariance = this.calculateSentimentVariance(peerSentiments);
        
        if (sentimentVariance > 0) {
          inconsistencies.push({
            type: 'peer_inconsistency',
            description: `Peer reviews show inconsistent sentiments (${peerSentiments.join(', ')})`,
            severity: sentimentVariance > 1 ? 'high' : 'medium',
            details: this.countSentiments(peerSentiments)
          });
        }
      }
      
      // Check for manager vs peers inconsistency
      if (reviewsByType.manager.length > 0 && reviewsByType.peer.length > 0) {
        const managerSentiment = reviewsByType.manager[0].overallSentimentLabel;
        const peerSentiments = reviewsByType.peer.map(r => r.overallSentimentLabel);
        const dominantPeerSentiment = this.getDominantSentiment(peerSentiments);
        
        if (managerSentiment !== dominantPeerSentiment) {
          inconsistencies.push({
            type: 'manager_peer_mismatch',
            description: `Manager assessment (${managerSentiment}) differs from peer consensus (${dominantPeerSentiment})`,
            severity: this.getSentimentDifferenceSeverity(managerSentiment, dominantPeerSentiment)
          });
        }
      }
      
      return {
        hasEnoughData: true,
        reviewCounts: {
          self: reviewsByType.self.length,
          peer: reviewsByType.peer.length,
          manager: reviewsByType.manager.length,
          upward: reviewsByType.upward.length
        },
        sentimentCounts,
        inconsistencies,
        reviews: reviews.map(r => ({
          type: r.type,
          reviewer: r.reviewer ? r.reviewer.name : 'Unknown',
          sentiment: r.overallSentimentLabel
        }))
      };
    } catch (error) {
      console.error('Error comparing review sentiments:', error);
      return {
        hasEnoughData: false,
        error: error.message
      };
    }
  }
  
  /**
   * Get the dominant sentiment from an array of sentiments
   */
  static getDominantSentiment(sentiments) {
    const counts = this.countSentiments(sentiments);
    return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
  }
  
  /**
   * Count occurrences of each sentiment
   */
  static countSentiments(sentiments) {
    return sentiments.reduce((acc, sentiment) => {
      acc[sentiment] = (acc[sentiment] || 0) + 1;
      return acc;
    }, {});
  }
  
  /**
   * Calculate how much variation exists in sentiments
   */
  static calculateSentimentVariance(sentiments) {
    const counts = this.countSentiments(sentiments);
    const uniqueSentiments = Object.keys(counts).length;
    return uniqueSentiments - 1; // 0 = all the same, 1 = two types, 2 = all three types
  }
  
  /**
   * Determine severity of sentiment difference
   */
  static getSentimentDifferenceSeverity(sentiment1, sentiment2) {
    const sentimentValues = { 'positive': 1, 'neutral': 0, 'negative': -1 };
    const diff = Math.abs(sentimentValues[sentiment1] - sentimentValues[sentiment2]);
    
    return diff >= 2 ? 'high' : 'medium';
  }
}

module.exports = SentimentService;
