/**
 * Test script to add vague language to a review and test sentiment analysis
 */
const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const Review = require('./models/Review');
const SentimentService = require('./services/SentimentService');

// Text with vague language to test
const vagueSampleText = "The employee does many things well but sometimes struggles with certain tasks. They're generally good but could probably improve in several areas. Overall, they're fairly competent most of the time, but occasionally miss deadlines.";

// Test non-vague text for comparison
const specificText = "The employee completed 5 projects on time and exceeded KPIs by 15%. They consistently attend all meetings, document their work thoroughly, and respond to emails within 2 hours. Their code has 90% test coverage.";

async function runTest() {
  try {
    // Find a submitted review
    const review = await Review.findOne({ status: 'submitted' });
    
    if (!review) {
      console.log("No submitted reviews found. Please submit a review first.");
      process.exit(1);
    }
    
    console.log(`Found review: ${review._id}`);
    
    // If review doesn't have answers array, initialize it
    if (!review.answers || !Array.isArray(review.answers)) {
      console.log("No answers array found, initializing it");
      review.answers = [
        {
          questionId: "sample_question_1",
          questionText: "Describe the employee's performance",
          textValue: ""
        },
        {
          questionId: "sample_question_2",
          questionText: "Describe the employee's strengths",
          textValue: ""
        }
      ];
    }
    
    // Add vague text to one answer and specific text to another
    if (review.answers && review.answers.length > 0) {
      // Find text answers
      const textAnswers = review.answers.filter(a => a.textValue);
      
      if (textAnswers.length >= 2) {
        console.log("Found at least 2 text answers to modify");
        
        // Add vague text to first answer
        textAnswers[0].textValue = vagueSampleText;
        console.log("Added vague text to answer 1");
        
        // Add specific text to second answer
        if (textAnswers[1]) {
          textAnswers[1].textValue = specificText;
          console.log("Added specific text to answer 2");
        }
      } else if (textAnswers.length === 1) {
        console.log("Found only 1 text answer to modify");
        textAnswers[0].textValue = vagueSampleText;
        console.log("Added vague text to answer");
      } else {
        console.log("No text answers found in review");
        if (review.answers[0]) {
          review.answers[0].textValue = vagueSampleText;
          console.log("Added text value to first answer");
        } else {
          console.log("No answers found in review");
          process.exit(1);
        }
      }
      
      // Run sentiment analysis
      console.log("Running sentiment analysis...");
      const analyzedReview = await SentimentService.analyzeReview(review);
      
      console.log("Sentiment analysis complete:");
      console.log("Overall sentiment:", analyzedReview.overallSentimentLabel);
      console.log("Overall vagueness flags:", analyzedReview.overallVaguenessFlags);
      
      // Print individual answers' sentiment
      analyzedReview.answers.forEach((answer, i) => {
        if (answer.textValue) {
          console.log(`\nAnswer ${i+1}:`);
          console.log(`Text: "${answer.textValue.substring(0, 50)}..."`);
          console.log(`Sentiment: ${answer.sentimentLabel}`);
          console.log(`Vagueness flags: ${answer.vaguenessFlags?.join(', ') || 'none'}`);
          console.log(`Vague words: ${answer.vagueWords?.join(', ') || 'none'}`);
        }
      });
      
      // Save the review
      await analyzedReview.save();
      console.log(`\nSaved review ${analyzedReview._id} with updated sentiment analysis`);
      
    } else {
      console.log("Review has no answers");
    }
    
  } catch (error) {
    console.error("Error:", error);
  } finally {
    mongoose.disconnect();
    console.log("Test complete");
  }
}

runTest();
