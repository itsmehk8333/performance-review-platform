const express = require('express');
const router = express.Router();
const Goal = require('../models/Goal');
const Feedback = require('../models/Feedback');
const Review = require('../models/Review');
const OpenAI = require('openai');

// OpenAI setup
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Helper function to handle missing API key
const handleMissingApiKey = (res) => {
  return res.status(500).json({ 
    msg: 'OpenAI API key is not configured. Please add a valid API key to your .env file.',
    suggestion: 'This is a placeholder feedback suggestion since the OpenAI API is not configured. Please provide specific, actionable feedback related to the goal progress and achievements.'
  });
};

// Helper function to extract a section from raw text when JSON parsing fails
function extractSection(text, sectionName, nextSectionName = null) {
  // Find the start of the section
  const startIndex = text.indexOf(sectionName);
  if (startIndex === -1) return `No ${sectionName} found`;
  
  // Find the start of the content after the section name
  const contentStartIndex = text.indexOf("\n", startIndex);
  if (contentStartIndex === -1) return `No ${sectionName} content found`;
  
  // Find the end of the section (either the next section or the end of text)
  let endIndex = text.length;
  if (nextSectionName) {
    const nextSectionIndex = text.indexOf(nextSectionName, contentStartIndex);
    if (nextSectionIndex !== -1) {
      endIndex = nextSectionIndex;
    }
  }
  
  // Extract the content
  const sectionContent = text.substring(contentStartIndex, endIndex).trim();
  return sectionContent;
}

// @route   POST api/ai/suggest
// @desc    Get AI suggestion for feedback
// @access  Private
router.post('/suggest', async (req, res) => {
  try {
    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
      return handleMissingApiKey(res);
    }
      const { goalId, contextFeedback, userProse } = req.body;
    
    // Validate goal exists
    const goal = await Goal.findById(goalId).populate('owner', 'name');
    if (!goal) {
      return res.status(404).json({ msg: 'Goal not found' });
    }
    
    // Determine if this is self-feedback or manager feedback
    const isSelfFeedback = goal.owner._id.toString() === req.user.id.toString();
    const isManagerFeedback = !isSelfFeedback && (req.user.role.name === 'Manager' || req.user.role.name === 'Admin');
    
    // Get previous feedback for context if not provided
    let feedbackContext = contextFeedback || [];
    if (!contextFeedback) {
      const previousFeedback = await Feedback.find({ goal: goalId })
        .populate('author', 'name')
        .sort({ createdAt: -1 })
        .limit(3);
      
      feedbackContext = previousFeedback.map(fb => {
        return `${fb.author.name}: "${fb.text}"`;
      });
    }
      // Build prompt for OpenAI
    let prompt = `You are a professional business coach helping write constructive feedback.
    
Goal: ${goal.title}
Description: ${goal.description}
Owner: ${goal.owner.name}
Progress: ${goal.progress}%
Status: ${goal.status}
Feedback Type: ${isSelfFeedback ? 'Self-feedback (from goal owner to themselves)' : isManagerFeedback ? 'Manager feedback (from manager to employee)' : 'Peer feedback (from colleague to colleague)'}

`;

    if (feedbackContext.length > 0) {
      prompt += `Previous feedback:
${feedbackContext.join('\n')}

`;
    }    prompt += `Based on the above context, generate professional, constructive feedback. The feedback should be:
1. Specific and actionable
2. Balanced (mention positives and areas for improvement)
3. Forward-looking
4. Written in a supportive tone
5. Approximately 3-5 sentences long
${isSelfFeedback 
  ? '6. Written in first person (I, me, my) as self-reflection on your own progress' 
  : isManagerFeedback 
    ? '6. Written from a manager to an employee with appropriate guidance and direction'
    : '6. Written as peer feedback focused on collaboration and support'
}

`;

    if (userProse) {
      prompt += `Use the following as a starting point, but improve and expand it:
"${userProse}"

`;
    }    // Call OpenAI for suggestion
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: `You are a professional business coach helping write constructive feedback. ${
          isSelfFeedback 
            ? 'The user is writing self-feedback about their own goal. Generate reflective, honest self-assessment that acknowledges both strengths and growth areas.'
            : isManagerFeedback
              ? 'The user is a manager writing feedback for their employee. Generate guidance that balances appreciation with constructive direction.'
              : 'The user is providing peer feedback to a colleague. Generate supportive, collaborative feedback.'
        }` },
        { role: "user", content: prompt }
      ],
      max_tokens: 300,
      temperature: 0.7,
    });
    
    const suggestion = response.choices[0].message.content.trim();
    
    res.json({ suggestion });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/ai/summarize
// @desc    Summarize a long text
// @access  Private
router.post('/summarize', async (req, res) => {
  try {
    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
      return res.status(500).json({ 
        msg: 'OpenAI API key is not configured. Please add a valid API key to your .env file.',
        summary: {
          keyThemes: "This is a placeholder for key themes (OpenAI API not configured).",
          strengthsWeaknesses: "This is a placeholder for strengths/weaknesses (OpenAI API not configured).",
          impactStatements: "This is a placeholder for impact statements (OpenAI API not configured)."
        }
      });
    }

    const { text } = req.body;
    
    if (!text || text.trim().length < 50) {
      return res.status(400).json({ msg: 'Text is too short to summarize' });
    }
    
    // Call OpenAI for structured summarization
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { 
          role: "system", 
          content: "You are a professional summarization assistant for performance reviews. Your task is to analyze responses and provide structured insights." 
        },
        { 
          role: "user", 
          content: `Please analyze the following self-assessment text and provide a structured summary with these three sections:
          1. Key Themes (2-3 bullet points highlighting the main themes)
          2. Strengths / Weaknesses (1-2 bullet points for each)
          3. Impact Statements (1-2 bullet points on business/team impact mentioned)
          
          Format the output as valid JSON with these three keys: keyThemes, strengthsWeaknesses, impactStatements.
          
          Text to analyze:
          
          ${text}` 
        }
      ],
      max_tokens: 400,
      temperature: 0.5,
    });
    
    let summary;
    try {
      // Parse the JSON from the response
      summary = JSON.parse(response.choices[0].message.content.trim());
      
      // Ensure all required fields are present
      if (!summary.keyThemes || !summary.strengthsWeaknesses || !summary.impactStatements) {
        throw new Error("Response missing required fields");
      }
    } catch (parseError) {
      // If parsing fails, create a structured summary from the raw text
      const rawSummary = response.choices[0].message.content.trim();
      summary = {
        keyThemes: extractSection(rawSummary, "Key Themes", "Strengths / Weaknesses"),
        strengthsWeaknesses: extractSection(rawSummary, "Strengths / Weaknesses", "Impact Statements"),
        impactStatements: extractSection(rawSummary, "Impact Statements")
      };
    }
    
    res.json({ summary });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/ai/generate-draft
// @desc    Generate a draft review based on goal data and past reviews
// @access  Private
router.post('/generate-draft', async (req, res) => {
  try {
    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
      return res.status(500).json({ 
        msg: 'OpenAI API key is not configured. Please add a valid API key to your .env file.',
        draft: 'This is a placeholder draft since the OpenAI API is not configured. Please provide specific, actionable feedback based on the reviewee\'s performance and goals.'
      });
    }

    const { revieweeId, reviewType, cycleId } = req.body;
    
    if (!revieweeId) {
      return res.status(400).json({ msg: 'Reviewee ID is required' });
    }

    // Find reviewee's goals
    const goals = await Goal.find({ owner: revieweeId })
                           .sort({ createdAt: -1 })
                           .limit(5);
                           
    // Find past reviews for the reviewee
    const pastReviews = await Review.find({ 
      reviewee: revieweeId,
      status: 'submitted',
      type: reviewType || { $in: ['peer', 'manager'] } // Filter by type if provided
    })
    .sort({ submittedAt: -1 })
    .limit(3)
    .populate('reviewer', 'name');

    // Prepare goal data
    const goalData = goals.map(goal => ({
      title: goal.title,
      description: goal.description,
      progress: goal.progress,
      status: goal.status
    }));
    
    // Prepare past review data
    const reviewData = pastReviews.map(review => ({
      type: review.type,
      submittedAt: review.submittedAt,
      content: review.content || '',
      reviewerName: review.reviewer?.name || 'Anonymous'
    }));
    
    // Build prompt for OpenAI
    let prompt = `You are assisting with drafting a ${reviewType || 'peer'} review for a team member.
    
Reviewee goals:
${goalData.length > 0 ? 
  goalData.map(g => `- ${g.title} (${g.description || 'No description'}) - Progress: ${g.progress}% - Status: ${g.status}`).join('\n') : 
  'No goals data available'}

${reviewData.length > 0 ? `Past reviews:
${reviewData.map(r => `${r.reviewerName} (${r.type}): "${r.content}"`).join('\n')}` : 
'No past review data available'}

Based on this information, generate a thoughtful, balanced, and specific draft review that:
1. Acknowledges specific accomplishments related to their goals
2. Provides constructive feedback on areas for improvement
3. Includes specific examples where possible
4. Is written in a professional, supportive tone
5. Is approximately 200-400 words in length

This is a ${reviewType || 'peer'} review, so focus on appropriate aspects for this review type:
${reviewType === 'self' ? '- Self-reflection and honest self-assessment' : 
  reviewType === 'manager' ? '- Performance evaluation, career development, and team contributions' :
  reviewType === 'upward' ? '- Management style, communication, and leadership qualities' :
  '- Collaboration, teamwork, skills, and peer-to-peer interactions'}`;

    // Call OpenAI for draft generation
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { 
          role: "system", 
          content: `You are a professional review writer assistant helping to draft workplace performance reviews. Provide balanced, specific, and constructive feedback.` 
        },
        { role: "user", content: prompt }
      ],
      max_tokens: 600,
      temperature: 0.7,
    });
    
    const draft = response.choices[0].message.content.trim();
    
    res.json({ draft });
  } catch (err) {
    console.error('Error generating review draft:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

module.exports = router;
