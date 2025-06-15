# Performance Review Platform - Documentation

This documentation provides a comprehensive guide to the Performance Review Platform, an AI-driven enterprise solution for managing performance reviews, goals, and feedback.

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Features](#features)
4. [API Reference](#api-reference)
5. [User Guides](#user-guides)
6. [Deployment Guide](#deployment-guide)
7. [Maintenance](#maintenance)
8. [Development Guide](#development-guide)

---

## System Overview

The Performance Review Platform is a comprehensive solution designed to modernize and streamline the performance management process in organizations. It leverages AI to enhance the quality of reviews, provides analytics for data-driven decisions, and offers a smooth user experience for admins, managers, and employees.

### Live Demo

- **Frontend**: [https://gorgeous-bienenstitch-932b3b.netlify.app/login](https://gorgeous-bienenstitch-932b3b.netlify.app/login)
- **Backend API**: [https://performance-review-platform.onrender.com/api](https://performance-review-platform.onrender.com/api)

### Demo Credentials
- **Admin**: admin@example.com / password123
- **Manager**: manager@example.com / password123
- **Employee**: employee1@example.com / password123 or employee2@example.com / password123

---

## Architecture

### Technology Stack

- **Frontend**:
  - React.js for UI components
  - Chakra UI for component styling
  - Context API for state management
  - Axios for API communication

- **Backend**:
  - Node.js runtime
  - Express.js web framework
  - JWT for authentication
  - MongoDB for data storage
  - Mongoose ORM for database interactions

- **AI/ML**:
  - OpenAI API for natural language processing
  - Custom sentiment analysis service
  - Auto-summarization capabilities

### System Architecture Diagram

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   React     │     │  Express    │     │  MongoDB    │
│  Frontend   │────▶│   API       │────▶│  Database   │
│             │◀────│             │◀────│             │
└─────────────┘     └──────┬──────┘     └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │  OpenAI     │
                    │   API       │
                    │             │
                    └─────────────┘
```

### Database Schema

The system uses MongoDB with the following key collections:

- **Users**: Employee profiles and authentication
- **Reviews**: Performance review data
- **Feedback**: Continuous feedback entries
- **Goals**: OKRs and performance goals
- **ReviewCycles**: Review period configurations
- **ReviewTemplates**: Customizable review templates

---

## Features

### 1. User Authentication & Access Control

The platform implements role-based access control with three primary roles:

- **Admin**: Full system access
- **Manager**: Department/team management capabilities
- **Employee**: Self-service and peer review functions

### 2. Goal Management

- Create and track OKRs (Objectives and Key Results)
- Establish individual, team, and organizational goals
- Track goal progress with visual indicators
- Link goals to performance reviews

### 3. Continuous Feedback

- Provide real-time feedback to colleagues
- Request feedback on specific goals or projects
- AI-powered sentiment analysis on feedback
- Feedback history tracking

### 4. Performance Reviews

- Configurable review cycles
- Multi-stage review workflows
- Self, peer, and manager assessments
- Review calibration and approval processes

### 5. AI-Powered Features

#### Self-Assessment Summarizer
The system can automatically analyze and summarize lengthy self-assessments to extract key themes, achievements, and development areas.

**Implementation**: Uses OpenAI's text processing capabilities to generate concise summaries of long-form answers.

#### Sentiment Analysis
All written feedback and reviews are analyzed for sentiment, helping to identify potential biases or concerns in review language.

**Implementation**: Custom sentiment analysis service that evaluates text for positive, neutral, or negative tone, highlighting potential issues.

#### Peer Review Suggestions
The system can generate draft peer reviews based on historical data, helping employees provide more meaningful feedback.

**Implementation**: OpenAI integration that analyzes past interactions, feedback, and goals to suggest effective review content.

### 6. Analytics Dashboard

- Review completion rates
- Feedback frequency metrics
- Department performance comparisons
- Sentiment analysis trends

---

## API Reference

### Authentication Endpoints

- `POST /api/auth/login` - User authentication
- `GET /api/auth/me` - Get current user profile
- `GET /api/auth/users` - List all users (Admin only)

### Goals API

- `GET /api/goals` - List goals
- `GET /api/goals/:id` - Get specific goal details
- `POST /api/goals` - Create new goal
- `PATCH /api/goals/:id/progress` - Update goal progress
- `DELETE /api/goals/:id` - Remove a goal
- `PATCH /api/goals/:id/tags` - Add tags to a goal
- `POST /api/goals/:id/comments` - Comment on a goal

### Feedback API

- `GET /api/feedback` - List feedback entries
- `POST /api/feedback` - Create new feedback
- `GET /api/feedback/tags` - Get feedback tags
- `GET /api/feedback/export` - Export feedback data (Manager/Admin)

### Reviews API

- `GET /api/reviews/cycles` - List review cycles
- `GET /api/reviews/cycles/:id` - Get specific cycle
- `POST /api/reviews/cycles` - Create review cycle
- `PUT /api/reviews/cycles/:id` - Update review cycle
- `DELETE /api/reviews/cycles/:id` - Delete review cycle
- `POST /api/reviews/cycles/:id/advance` - Advance cycle state
- `GET /api/reviews` - List reviews
- `GET /api/reviews/:id` - Get specific review
- `POST /api/reviews/assign` - Assign reviews
- `POST /api/reviews/:id/submit` - Submit review
- `POST /api/reviews/:id/calibrate` - Calibrate review
- `GET /api/reviews/export` - Export reviews
- `GET /api/reviews/:id/export` - Export specific review

### AI API

- `POST /api/ai/suggest` - Get suggestions
- `POST /api/ai/summarize` - Summarize text
- `POST /api/ai/generate-draft` - Generate review draft

### Analytics API

- `GET /api/analytics/review-volume` - Get review volume data
- `GET /api/analytics/feedback-frequency` - Get feedback frequency data

---

## User Guides

### Admin Guide

As an Admin, you have complete access to the platform with capabilities to:

1. **Manage Users**:
   - View all users in the system
   - Update user roles and departments
   - Configure reporting relationships

2. **Configure Review Cycles**:
   - Create new review cycles
   - Set review period dates
   - Configure review templates
   - Launch and monitor review cycles

3. **Review Templates**:
   - Create customized review templates
   - Define sections and questions
   - Set scoring scales

4. **Analytics**:
   - Access comprehensive system analytics
   - Export data for reporting
   - Monitor review completion rates

### Manager Guide

As a Manager, you can:

1. **Team Management**:
   - View your team structure
   - Manage direct reports

2. **Goal Setting**:
   - Create goals for your team
   - Align team goals with department/company objectives
   - Track goal progress

3. **Performance Reviews**:
   - Complete reviews for direct reports
   - Calibrate team reviews
   - Approve reviews from your team

4. **Feedback**:
   - Provide ongoing feedback to team members
   - Review feedback given to your team

### Employee Guide

As an Employee, you can:

1. **Self-Management**:
   - View and update your profile
   - Track your goals and progress

2. **Performance Reviews**:
   - Complete self-assessments
   - Provide peer reviews
   - View your performance reviews

3. **Feedback**:
   - Request feedback
   - Provide feedback to colleagues
   - Track feedback history

---

## Deployment Guide

The application is deployed using cloud services:

### Frontend Deployment (Netlify)

1. The React frontend is hosted on Netlify
2. Deployment URL: https://gorgeous-bienenstitch-932b3b.netlify.app
3. Configuration includes:
   - SPA redirect settings (`_redirects` file)
   - Environment variables for API URL

### Backend Deployment (Render)

1. The Express API is hosted on Render
2. API URL: https://performance-review-platform.onrender.com/api
3. Configuration includes:
   - Environment variables for database connection
   - CORS settings to allow frontend access
   - OpenAI API key configuration

### Database (MongoDB Atlas)

1. Cloud-hosted MongoDB instance
2. Configured with proper indexes for performance
3. Regular backups enabled

---

## Maintenance

### Regular Maintenance Tasks

1. **Database Maintenance**:
   - Regular backups (automatic via MongoDB Atlas)
   - Periodic index optimization
   - Data archiving for old review cycles

2. **Security Updates**:
   - Regular dependency updates
   - Security patch application
   - Token rotation

3. **Performance Monitoring**:
   - API response time tracking
   - Database query performance analysis
   - Frontend load time optimization

### Troubleshooting Common Issues

1. **Authentication Problems**:
   - Check JWT token validity
   - Verify user permissions
   - Ensure correct credentials

2. **API Connection Issues**:
   - Verify CORS settings
   - Check API endpoint availability
   - Validate request format

3. **Database Connection Issues**:
   - Verify MongoDB connection string
   - Check network connectivity
   - Validate database user permissions

---

## Development Guide

### Local Development Setup

1. **Prerequisites**:
   - Node.js v14+
   - MongoDB (local or Atlas)
   - npm or yarn
   - OpenAI API key

2. **Installation Steps**:
   ```bash
   # Clone repository
   git clone <repository-url>
   
   # Install server dependencies
   cd server
   npm install
   
   # Configure environment variables
   # Create .env file with:
   # MONGO_URI=your_mongodb_uri
   # JWT_SECRET=your_jwt_secret
   # OPENAI_API_KEY=your_openai_api_key
   # PORT=5000
   
   # Start server
   npm run dev
   
   # In a new terminal, install client dependencies
   cd ../client
   npm install
   
   # Start client
   npm start
   ```

3. **Seed Data**:
   ```bash
   cd server
   npm run seed
   ```

### Code Structure

1. **Frontend Structure**:
   - `/client/src/components`: Reusable UI components
   - `/client/src/context`: React context providers
   - `/client/src/pages`: Page components
   - `/client/src/utils`: Utility functions and API client

2. **Backend Structure**:
   - `/server/routes`: API endpoint definitions
   - `/server/models`: Mongoose data models
   - `/server/middleware`: Express middleware
   - `/server/services`: Business logic services
   - `/server/config`: Configuration files

### Development Workflow

1. **Feature Development**:
   - Create feature branch from main
   - Implement changes
   - Write tests
   - Create pull request

2. **Testing**:
   - Run unit tests
   - Perform integration testing
   - Verify against acceptance criteria

3. **Deployment**:
   - Merge to main branch
   - CI/CD pipeline triggers
   - Deploy to staging/production

---

For additional information or support, please contact the development team.
