# AI Features Technical Documentation

This document provides detailed technical information about the AI features implemented in the Performance Review Platform.

## Table of Contents

1. [Overview](#overview)
2. [AI Components](#ai-components)
3. [Implementation Details](#implementation-details)
4. [API Reference](#api-reference)
5. [Performance Considerations](#performance-considerations)
6. [Future Enhancements](#future-enhancements)

---

## Overview

The Performance Review Platform incorporates several AI-powered features to enhance the quality of reviews, provide insights into feedback, and streamline the review process. These features are implemented using OpenAI's API for natural language processing and custom sentiment analysis services.

---

## AI Components

### 1. Self-Assessment Summarizer

**Purpose**: Automatically analyze and summarize lengthy self-assessments to extract key themes, achievements, and development areas.

**Technical Implementation**:
- Uses OpenAI's GPT model to process and summarize text
- Input: Raw self-assessment text
- Output: Structured summary highlighting key points, strengths, areas for improvement, and action items
- Processing happens asynchronously to prevent UI blocking

### 2. Sentiment Analysis Engine

**Purpose**: Analyze the sentiment of written feedback and reviews to identify potential biases, overly negative/positive language, or vague statements.

**Technical Implementation**:
- Custom NLP model trained on performance review language
- Categories sentiment as positive, neutral, or negative
- Detects vague language that lacks specificity
- Scores text on a scale of -1.0 (very negative) to 1.0 (very positive)
- Results are cached to improve performance

### 3. Peer Review Draft Generator

**Purpose**: Generate draft peer reviews based on historical data, helping employees provide more meaningful feedback.

**Technical Implementation**:
- Collects historical feedback between reviewer and reviewee
- Analyzes goal progress and achievements
- Uses OpenAI to generate a structured draft review
- Includes prompts for specific examples and balanced feedback
- Draft is presented as a starting point that requires human editing and validation

---

## Implementation Details

### AI Service Architecture

```
Frontend Request -> API Gateway -> AI Service Router -> Specific AI Service -> Response Formatter -> Frontend
```

### Self-Assessment Summarizer

```javascript
// Simplified implementation logic
async function summarizeText(text) {
  // 1. Preprocess text to remove irrelevant content
  const cleanedText = preprocessText(text);
  
  // 2. Send to OpenAI API with specific prompt
  const prompt = `Summarize the following self-assessment in a structured format. 
                  Extract: 1) Key achievements, 2) Development areas, 3) Goals for next period.
                  Text: ${cleanedText}`;
  
  const response = await openai.createCompletion({
    model: "text-davinci-003",
    prompt: prompt,
    max_tokens: 500,
    temperature: 0.5,
  });
  
  // 3. Post-process the response
  const summary = postProcessSummary(response.choices[0].text);
  
  return summary;
}
```

### Sentiment Analysis

```javascript
// Simplified implementation logic
async function analyzeSentiment(text) {
  // 1. Check cache for this text
  const cachedResult = await sentimentCache.get(hashText(text));
  if (cachedResult) return cachedResult;
  
  // 2. Preprocess text
  const sentences = splitIntoSentences(text);
  
  // 3. Analyze sentiment for each sentence
  const sentiments = await Promise.all(sentences.map(async (sentence) => {
    const result = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: `Analyze the sentiment of this sentence in the context of a work performance review. 
               Provide a score from -1.0 (very negative) to 1.0 (very positive).
               Sentence: "${sentence}"`,
      max_tokens: 50,
      temperature: 0.3,
    });
    
    return {
      sentence,
      score: extractScoreFromResponse(result.choices[0].text),
    };
  }));
  
  // 4. Analyze for vague language
  const vagueLanguageAnalysis = await detectVagueLanguage(text);
  
  // 5. Aggregate results
  const result = {
    overallScore: calculateAverageScore(sentiments),
    sentenceScores: sentiments,
    vagueLanguage: vagueLanguageAnalysis,
  };
  
  // 6. Cache result
  await sentimentCache.set(hashText(text), result);
  
  return result;
}
```

### Review Draft Generator

```javascript
// Simplified implementation logic
async function generateReviewDraft(revieweeId, reviewerId, reviewType) {
  // 1. Collect historical data
  const historicalFeedback = await getFeedbackBetweenUsers(reviewerId, revieweeId);
  const revieweeGoals = await getGoalsByUser(revieweeId);
  const revieweeRole = await getUserRole(revieweeId);
  
  // 2. Format data for prompt
  const promptData = formatDataForPrompt(historicalFeedback, revieweeGoals, revieweeRole);
  
  // 3. Generate draft with OpenAI
  const prompt = `Generate a balanced and specific ${reviewType} performance review draft based on the following information:
                  
                  Historical Feedback: ${promptData.feedback}
                  
                  Goals and Achievements: ${promptData.goals}
                  
                  Role Responsibilities: ${promptData.role}
                  
                  The review should include: 1) Specific strengths with examples, 2) Development areas with constructive suggestions,
                  3) Forward-looking recommendations, 4) Overall performance assessment.`;
  
  const response = await openai.createCompletion({
    model: "text-davinci-003",
    prompt: prompt,
    max_tokens: 1000,
    temperature: 0.7,
  });
  
  // 4. Post-process and format the draft
  const formattedDraft = formatDraft(response.choices[0].text);
  
  return formattedDraft;
}
```

---

## API Reference

### Self-Assessment Summarizer

**Endpoint**: `POST /api/ai/summarize`

**Request Body**:
```json
{
  "text": "Long self-assessment text to summarize..."
}
```

**Response**:
```json
{
  "summary": {
    "keyAchievements": ["Achievement 1", "Achievement 2"],
    "developmentAreas": ["Area 1", "Area 2"],
    "goalsForNextPeriod": ["Goal 1", "Goal 2"],
    "overallSummary": "Concise summary text..."
  }
}
```

### Sentiment Analysis

**Endpoint**: `POST /api/reviews/:id/recalculate-sentiment`

**Request Body**: None (uses the review text from the database)

**Response**:
```json
{
  "overallScore": 0.65,
  "classification": "positive",
  "sentenceBreakdown": [
    {
      "sentence": "Example sentence",
      "score": 0.8,
      "classification": "positive"
    }
  ],
  "vagueLanguage": [
    {
      "phrase": "did well",
      "suggestion": "Specify how they did well with examples"
    }
  ]
}
```

**Endpoint**: `GET /api/reviews/:id/sentiment-comparison`

**Response**:
```json
{
  "selfReview": {
    "score": 0.2,
    "classification": "neutral"
  },
  "managerReview": {
    "score": 0.7,
    "classification": "positive"
  },
  "peerReviews": [
    {
      "reviewerId": "123",
      "score": 0.6,
      "classification": "positive"
    }
  ],
  "discrepancies": [
    {
      "type": "self-manager",
      "difference": 0.5,
      "significance": "high"
    }
  ]
}
```

### Review Draft Generator

**Endpoint**: `POST /api/ai/generate-draft`

**Request Body**:
```json
{
  "revieweeId": "user123",
  "reviewType": "peer",
  "cycleId": "cycle456"
}
```

**Response**:
```json
{
  "draft": "Formatted review draft text with sections...",
  "sections": {
    "strengths": "Strengths section...",
    "developmentAreas": "Areas for improvement...",
    "recommendations": "Recommendations section..."
  },
  "dataUsed": {
    "feedbackCount": 5,
    "goalsAnalyzed": 3
  }
}
```

---

## Performance Considerations

### Caching Strategy

1. **Sentiment Analysis Caching**:
   - Results are cached using text hash as key
   - Cache invalidation on review update
   - Distributed cache using Redis

2. **OpenAI API Rate Limiting**:
   - Request queuing for high-traffic periods
   - Prioritization of real-time user requests
   - Batch processing for bulk operations

### Response Time Optimization

1. **Parallel Processing**:
   - Sentiment analysis runs on multiple sentences in parallel
   - Background processing for non-blocking operations

2. **Model Selection**:
   - Using the appropriate OpenAI model for each task
   - Balance between quality and performance

---

## Future Enhancements

1. **Personalized Review Coaching**:
   - AI coach that provides real-time guidance during review writing
   - Suggestions for more effective feedback
   - Detection of bias and language that could be improved

2. **Predictive Performance Insights**:
   - Analyze patterns in reviews and feedback to predict future performance
   - Early identification of high performers and employees at risk
   - Trend analysis across review cycles

3. **Enhanced Natural Language Processing**:
   - More advanced sentiment analysis with emotion detection
   - Better understanding of industry-specific terminology
   - Multi-language support for global organizations

4. **Automated Goal Suggestions**:
   - AI-generated development goals based on review content
   - Personalized learning recommendations
   - Skill gap analysis
