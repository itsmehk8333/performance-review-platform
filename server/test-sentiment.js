const express = require('express');
const mongoose = require('mongoose');
const Review = require('./models/Review');
const SentimentService = require('./services/SentimentService');

// This is a test script to add text answers to a review for sentiment analysis testing
// You need to replace this with your own review ID from your database
const testReviewId = '6499c8f1a2b48800d8c1a1a1'; // Replace with an actual review ID

const addAnswersToReview = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/performance-review', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('Connected to MongoDB');
    
    // Find the review
    const review = await Review.findById(testReviewId);
    
    if (!review) {
      console.error('Review not found');
      return;
    }
    
    console.log('Found review:', review._id);
    
    // Add sample text answers if there are none
    if (!review.answers || review.answers.length === 0) {
      console.log('Adding test answers to review...');
      
      // Create sample answers with text content
      review.answers = [
        {
          questionId: new mongoose.Types.ObjectId(), // Generate a random ObjectId
          type: 'open-ended',
          textValue: 'I think this project was very successful. The team worked well together and delivered on time.'
        },
        {
          questionId: new mongoose.Types.ObjectId(),
          type: 'open-ended',
          textValue: 'Communication was excellent throughout the project.'
        },
        {
          questionId: new mongoose.Types.ObjectId(),
          type: 'open-ended',
          textValue: 'There were some challenges with the timeline, but we managed to overcome them.'
        }
      ];
      
      // Save the review with the new answers
      await review.save();
      console.log('Test answers added successfully');
      
      // Now try to analyze the sentiment
      console.log('Analyzing sentiment...');
      const analyzedReview = await SentimentService.analyzeReview(review);
      
      console.log('Sentiment analysis results:');
      console.log('Overall sentiment:', analyzedReview.overallSentimentLabel);
      console.log('Answer sentiments:', analyzedReview.answers.map(a => ({
        text: a.textValue.substring(0, 30) + '...',
        sentiment: a.sentimentLabel,
        score: a.sentimentScore,
        flags: a.vaguenessFlags
      })));
      
      // Save the analyzed review
      await analyzedReview.save();
      console.log('Analyzed review saved');
    } else {
      console.log('Review already has answers:', review.answers.length);
      
      // Log the current answers
      console.log('Current answers:');
      review.answers.forEach((answer, i) => {
        console.log(`Answer ${i+1}:`, {
          type: answer.type,
          hasText: !!answer.textValue,
          textLength: answer.textValue ? answer.textValue.length : 0,
          sentiment: answer.sentimentLabel
        });
      });
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the function
addAnswersToReview();
