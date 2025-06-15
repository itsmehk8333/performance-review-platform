# API Reference Documentation

This document provides a comprehensive reference for all API endpoints available in the Performance Review Platform.

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Users and Auth API](#users-and-auth-api)
4. [Goals API](#goals-api)
5. [Feedback API](#feedback-api)
6. [Reviews API](#reviews-api)
7. [Templates API](#templates-api)
8. [AI API](#ai-api)
9. [Analytics API](#analytics-api)
10. [Organization API](#organization-api)
11. [Error Handling](#error-handling)

---

## Overview

The Performance Review Platform API is a RESTful service built with Node.js and Express. All endpoints return data in JSON format and require authentication unless explicitly specified.

**Base URL**: `https://performance-review-platform.onrender.com/api`

**Response Format**:

Success responses follow this structure:
```json
{
  "success": true,
  "data": { ... }
}
```

Error responses follow this structure:
```json
{
  "success": false,
  "error": "Error message",
  "details": { ... } // Optional additional error details
}
```

---

## Authentication

The API uses JWT (JSON Web Token) for authentication. 

### Obtaining a Token

Make a POST request to `/api/auth/login` with valid credentials to receive a JWT token.

### Using the Token

Include the token in the Authorization header of subsequent requests:

```
Authorization: Bearer <your_token_here>
```

### Token Expiration

Tokens expire after 24 hours. You'll need to login again to obtain a new token.

---

## Users and Auth API

### Login User

Authenticates a user and returns a JWT token.

**Endpoint**: `POST /api/auth/login`

**Authentication Required**: No

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "_id": "60d5ec66f10e8a001f4fcf1a",
      "name": "John Doe",
      "email": "user@example.com",
      "role": "employee",
      "department": "Engineering"
    }
  }
}
```

### Get Current User

Returns the profile of the currently authenticated user.

**Endpoint**: `GET /api/auth/me`

**Authentication Required**: Yes

**Response**:
```json
{
  "success": true,
  "data": {
    "_id": "60d5ec66f10e8a001f4fcf1a",
    "name": "John Doe",
    "email": "user@example.com",
    "role": "employee",
    "department": "Engineering",
    "manager": "60d5ec66f10e8a001f4fcf1b",
    "hireDate": "2022-01-15T00:00:00.000Z"
  }
}
```

### Get All Users

Returns a list of all users in the system.

**Endpoint**: `GET /api/auth/users`

**Authentication Required**: Yes

**Required Role**: Admin

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "_id": "60d5ec66f10e8a001f4fcf1a",
      "name": "John Doe",
      "email": "user@example.com",
      "role": "employee",
      "department": "Engineering"
    },
    {
      "_id": "60d5ec66f10e8a001f4fcf1b",
      "name": "Jane Smith",
      "email": "manager@example.com",
      "role": "manager",
      "department": "Engineering"
    }
  ]
}
```

---

## Goals API

### Get Goals

Retrieves a list of goals based on provided filters.

**Endpoint**: `GET /api/goals`

**Authentication Required**: Yes

**Query Parameters**:
- `userId` (optional): Filter goals by user ID
- `status` (optional): Filter by status (active, completed, etc.)
- `type` (optional): Filter by goal type (individual, team, department, company)

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "_id": "60d5ec66f10e8a001f4fcf2a",
      "title": "Improve code quality",
      "description": "Reduce bugs by improving code quality through better testing",
      "type": "individual",
      "status": "active",
      "progress": 75,
      "userId": "60d5ec66f10e8a001f4fcf1a",
      "dueDate": "2023-12-31T00:00:00.000Z",
      "createdAt": "2023-01-15T00:00:00.000Z"
    }
  ]
}
```

### Get Goal by ID

Retrieves a specific goal by its ID.

**Endpoint**: `GET /api/goals/:id`

**Authentication Required**: Yes

**Response**:
```json
{
  "success": true,
  "data": {
    "_id": "60d5ec66f10e8a001f4fcf2a",
    "title": "Improve code quality",
    "description": "Reduce bugs by improving code quality through better testing",
    "type": "individual",
    "status": "active",
    "progress": 75,
    "userId": "60d5ec66f10e8a001f4fcf1a",
    "dueDate": "2023-12-31T00:00:00.000Z",
    "keyResults": [
      {
        "title": "Implement unit tests",
        "progress": 80
      },
      {
        "title": "Set up CI/CD pipeline",
        "progress": 70
      }
    ],
    "comments": [
      {
        "text": "Making good progress on unit tests",
        "userId": "60d5ec66f10e8a001f4fcf1a",
        "createdAt": "2023-06-15T00:00:00.000Z"
      }
    ]
  }
}
```

### Create Goal

Creates a new goal.

**Endpoint**: `POST /api/goals`

**Authentication Required**: Yes

**Request Body**:
```json
{
  "title": "Improve customer satisfaction",
  "description": "Increase customer satisfaction scores by enhancing user experience",
  "type": "individual",
  "userId": "60d5ec66f10e8a001f4fcf1a",
  "dueDate": "2023-12-31T00:00:00.000Z",
  "keyResults": [
    {
      "title": "Conduct user research",
      "progress": 0
    },
    {
      "title": "Implement UX improvements",
      "progress": 0
    }
  ]
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "_id": "60d5ec66f10e8a001f4fcf2b",
    "title": "Improve customer satisfaction",
    "description": "Increase customer satisfaction scores by enhancing user experience",
    "type": "individual",
    "status": "active",
    "progress": 0,
    "userId": "60d5ec66f10e8a001f4fcf1a",
    "dueDate": "2023-12-31T00:00:00.000Z",
    "keyResults": [
      {
        "title": "Conduct user research",
        "progress": 0
      },
      {
        "title": "Implement UX improvements",
        "progress": 0
      }
    ],
    "createdAt": "2023-06-15T00:00:00.000Z"
  }
}
```

### Update Goal Progress

Updates the progress of a goal.

**Endpoint**: `PATCH /api/goals/:id/progress`

**Authentication Required**: Yes

**Request Body**:
```json
{
  "progress": 50,
  "keyResults": [
    {
      "title": "Conduct user research",
      "progress": 100
    },
    {
      "title": "Implement UX improvements",
      "progress": 25
    }
  ]
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "_id": "60d5ec66f10e8a001f4fcf2b",
    "title": "Improve customer satisfaction",
    "progress": 50,
    "keyResults": [
      {
        "title": "Conduct user research",
        "progress": 100
      },
      {
        "title": "Implement UX improvements",
        "progress": 25
      }
    ],
    "updatedAt": "2023-06-20T00:00:00.000Z"
  }
}
```

### Delete Goal

Deletes a specific goal.

**Endpoint**: `DELETE /api/goals/:id`

**Authentication Required**: Yes

**Response**:
```json
{
  "success": true,
  "data": {
    "message": "Goal deleted successfully"
  }
}
```

---

## Feedback API

### Get Feedback

Retrieves feedback entries based on provided filters.

**Endpoint**: `GET /api/feedback`

**Authentication Required**: Yes

**Query Parameters**:
- `receiverId` (optional): Filter by feedback receiver
- `giverId` (optional): Filter by feedback giver
- `goalId` (optional): Filter by related goal
- `startDate` (optional): Filter by date range start
- `endDate` (optional): Filter by date range end

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "_id": "60d5ec66f10e8a001f4fcf3a",
      "content": "Great job on the project! Your attention to detail was impressive.",
      "giverId": "60d5ec66f10e8a001f4fcf1b",
      "receiverId": "60d5ec66f10e8a001f4fcf1a",
      "goalId": "60d5ec66f10e8a001f4fcf2a",
      "sentimentScore": 0.85,
      "tags": ["communication", "quality"],
      "createdAt": "2023-06-15T00:00:00.000Z"
    }
  ]
}
```

### Create Feedback

Creates a new feedback entry.

**Endpoint**: `POST /api/feedback`

**Authentication Required**: Yes

**Request Body**:
```json
{
  "content": "I appreciated your leadership during the recent project. The team was well-coordinated thanks to your efforts.",
  "receiverId": "60d5ec66f10e8a001f4fcf1a",
  "goalId": "60d5ec66f10e8a001f4fcf2a",
  "tags": ["leadership", "teamwork"]
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "_id": "60d5ec66f10e8a001f4fcf3b",
    "content": "I appreciated your leadership during the recent project. The team was well-coordinated thanks to your efforts.",
    "giverId": "60d5ec66f10e8a001f4fcf1b",
    "receiverId": "60d5ec66f10e8a001f4fcf1a",
    "goalId": "60d5ec66f10e8a001f4fcf2a",
    "sentimentScore": 0.75,
    "tags": ["leadership", "teamwork"],
    "createdAt": "2023-06-20T00:00:00.000Z"
  }
}
```

### Get Feedback Tags

Retrieves a list of all feedback tags in the system.

**Endpoint**: `GET /api/feedback/tags`

**Authentication Required**: Yes

**Response**:
```json
{
  "success": true,
  "data": ["communication", "quality", "leadership", "teamwork", "innovation"]
}
```

### Export Feedback

Exports feedback data in CSV format.

**Endpoint**: `GET /api/feedback/export`

**Authentication Required**: Yes

**Required Role**: Manager or Admin

**Query Parameters**:
- `format` (optional): Export format (csv, pdf). Default is csv.
- Other filter parameters as in GET /api/feedback

**Response**:
Binary file download (CSV or PDF)

---

## Reviews API

### Get Review Cycles

Retrieves a list of review cycles.

**Endpoint**: `GET /api/reviews/cycles`

**Authentication Required**: Yes

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "_id": "60d5ec66f10e8a001f4fcf4a",
      "name": "Mid-Year Review 2023",
      "startDate": "2023-06-01T00:00:00.000Z",
      "endDate": "2023-06-30T00:00:00.000Z",
      "status": "active",
      "templateId": "60d5ec66f10e8a001f4fcf5a",
      "createdAt": "2023-05-15T00:00:00.000Z"
    }
  ]
}
```

### Get Specific Review Cycle

Retrieves details of a specific review cycle.

**Endpoint**: `GET /api/reviews/cycles/:id`

**Authentication Required**: Yes

**Response**:
```json
{
  "success": true,
  "data": {
    "_id": "60d5ec66f10e8a001f4fcf4a",
    "name": "Mid-Year Review 2023",
    "startDate": "2023-06-01T00:00:00.000Z",
    "endDate": "2023-06-30T00:00:00.000Z",
    "status": "active",
    "templateId": "60d5ec66f10e8a001f4fcf5a",
    "phases": [
      {
        "name": "Self Review",
        "startDate": "2023-06-01T00:00:00.000Z",
        "endDate": "2023-06-10T00:00:00.000Z",
        "status": "completed"
      },
      {
        "name": "Peer Review",
        "startDate": "2023-06-11T00:00:00.000Z",
        "endDate": "2023-06-20T00:00:00.000Z",
        "status": "active"
      },
      {
        "name": "Manager Review",
        "startDate": "2023-06-21T00:00:00.000Z",
        "endDate": "2023-06-30T00:00:00.000Z",
        "status": "pending"
      }
    ],
    "createdAt": "2023-05-15T00:00:00.000Z"
  }
}
```

### Create Review Cycle

Creates a new review cycle.

**Endpoint**: `POST /api/reviews/cycles`

**Authentication Required**: Yes

**Required Role**: Admin

**Request Body**:
```json
{
  "name": "Annual Review 2023",
  "startDate": "2023-12-01T00:00:00.000Z",
  "endDate": "2023-12-31T00:00:00.000Z",
  "templateId": "60d5ec66f10e8a001f4fcf5a",
  "phases": [
    {
      "name": "Self Review",
      "startDate": "2023-12-01T00:00:00.000Z",
      "endDate": "2023-12-10T00:00:00.000Z"
    },
    {
      "name": "Peer Review",
      "startDate": "2023-12-11T00:00:00.000Z",
      "endDate": "2023-12-20T00:00:00.000Z"
    },
    {
      "name": "Manager Review",
      "startDate": "2023-12-21T00:00:00.000Z",
      "endDate": "2023-12-31T00:00:00.000Z"
    }
  ]
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "_id": "60d5ec66f10e8a001f4fcf4b",
    "name": "Annual Review 2023",
    "startDate": "2023-12-01T00:00:00.000Z",
    "endDate": "2023-12-31T00:00:00.000Z",
    "status": "pending",
    "templateId": "60d5ec66f10e8a001f4fcf5a",
    "phases": [
      {
        "name": "Self Review",
        "startDate": "2023-12-01T00:00:00.000Z",
        "endDate": "2023-12-10T00:00:00.000Z",
        "status": "pending"
      },
      {
        "name": "Peer Review",
        "startDate": "2023-12-11T00:00:00.000Z",
        "endDate": "2023-12-20T00:00:00.000Z",
        "status": "pending"
      },
      {
        "name": "Manager Review",
        "startDate": "2023-12-21T00:00:00.000Z",
        "endDate": "2023-12-31T00:00:00.000Z",
        "status": "pending"
      }
    ],
    "createdAt": "2023-06-20T00:00:00.000Z"
  }
}
```

### Get Reviews

Retrieves a list of reviews based on provided filters.

**Endpoint**: `GET /api/reviews`

**Authentication Required**: Yes

**Query Parameters**:
- `cycleId` (optional): Filter by review cycle
- `revieweeId` (optional): Filter by reviewee
- `reviewerId` (optional): Filter by reviewer
- `status` (optional): Filter by status

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "_id": "60d5ec66f10e8a001f4fcf6a",
      "cycleId": "60d5ec66f10e8a001f4fcf4a",
      "revieweeId": "60d5ec66f10e8a001f4fcf1a",
      "reviewerId": "60d5ec66f10e8a001f4fcf1b",
      "type": "manager",
      "status": "submitted",
      "submittedDate": "2023-06-25T00:00:00.000Z",
      "sentimentScore": 0.65
    }
  ]
}
```

### Get Specific Review

Retrieves details of a specific review.

**Endpoint**: `GET /api/reviews/:id`

**Authentication Required**: Yes

**Response**:
```json
{
  "success": true,
  "data": {
    "_id": "60d5ec66f10e8a001f4fcf6a",
    "cycleId": "60d5ec66f10e8a001f4fcf4a",
    "revieweeId": {
      "_id": "60d5ec66f10e8a001f4fcf1a",
      "name": "John Doe",
      "email": "user@example.com",
      "role": "employee",
      "department": "Engineering"
    },
    "reviewerId": {
      "_id": "60d5ec66f10e8a001f4fcf1b",
      "name": "Jane Smith",
      "email": "manager@example.com",
      "role": "manager",
      "department": "Engineering"
    },
    "type": "manager",
    "status": "submitted",
    "responses": [
      {
        "questionId": "q1",
        "question": "What were the employee's key achievements?",
        "answer": "John successfully completed the database migration project ahead of schedule and with minimal disruption to users."
      },
      {
        "questionId": "q2",
        "question": "What are areas for improvement?",
        "answer": "John could improve his documentation practices to make knowledge transfer more efficient."
      }
    ],
    "ratings": {
      "technical": 4,
      "communication": 3,
      "teamwork": 4,
      "leadership": 3,
      "overall": 3.5
    },
    "submittedDate": "2023-06-25T00:00:00.000Z",
    "sentimentScore": 0.65,
    "createdAt": "2023-06-20T00:00:00.000Z",
    "updatedAt": "2023-06-25T00:00:00.000Z"
  }
}
```

### Submit Review

Submits a completed review.

**Endpoint**: `POST /api/reviews/:id/submit`

**Authentication Required**: Yes

**Request Body**:
```json
{
  "responses": [
    {
      "questionId": "q1",
      "answer": "Sarah demonstrated excellent technical skills throughout the project, particularly in solving complex performance issues."
    },
    {
      "questionId": "q2",
      "answer": "Sarah could improve her communication with cross-functional teams to ensure all stakeholders are aligned."
    }
  ],
  "ratings": {
    "technical": 5,
    "communication": 3,
    "teamwork": 4,
    "leadership": 4,
    "overall": 4
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "_id": "60d5ec66f10e8a001f4fcf6b",
    "status": "submitted",
    "responses": [
      {
        "questionId": "q1",
        "question": "What were the employee's key achievements?",
        "answer": "Sarah demonstrated excellent technical skills throughout the project, particularly in solving complex performance issues."
      },
      {
        "questionId": "q2",
        "question": "What are areas for improvement?",
        "answer": "Sarah could improve her communication with cross-functional teams to ensure all stakeholders are aligned."
      }
    ],
    "ratings": {
      "technical": 5,
      "communication": 3,
      "teamwork": 4,
      "leadership": 4,
      "overall": 4
    },
    "submittedDate": "2023-06-25T00:00:00.000Z",
    "sentimentScore": 0.72,
    "updatedAt": "2023-06-25T00:00:00.000Z"
  }
}
```

---

## Templates API

### Get Review Templates

Retrieves a list of review templates.

**Endpoint**: `GET /api/templates`

**Authentication Required**: Yes

**Required Role**: Admin or Manager

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "_id": "60d5ec66f10e8a001f4fcf5a",
      "name": "Standard Performance Review",
      "description": "General performance review template for all employees",
      "createdAt": "2023-01-15T00:00:00.000Z"
    },
    {
      "_id": "60d5ec66f10e8a001f4fcf5b",
      "name": "Engineering Review",
      "description": "Specialized review template for engineering roles",
      "createdAt": "2023-01-20T00:00:00.000Z"
    }
  ]
}
```

### Get Specific Template

Retrieves details of a specific review template.

**Endpoint**: `GET /api/templates/:id`

**Authentication Required**: Yes

**Required Role**: Admin or Manager

**Response**:
```json
{
  "success": true,
  "data": {
    "_id": "60d5ec66f10e8a001f4fcf5a",
    "name": "Standard Performance Review",
    "description": "General performance review template for all employees",
    "sections": [
      {
        "title": "Performance Assessment",
        "questions": [
          {
            "id": "q1",
            "text": "What were the employee's key achievements?",
            "type": "text"
          },
          {
            "id": "q2",
            "text": "What are areas for improvement?",
            "type": "text"
          }
        ]
      },
      {
        "title": "Skills Evaluation",
        "questions": [
          {
            "id": "q3",
            "text": "Rate technical skills",
            "type": "rating",
            "scale": 5
          },
          {
            "id": "q4",
            "text": "Rate communication skills",
            "type": "rating",
            "scale": 5
          }
        ]
      }
    ],
    "createdAt": "2023-01-15T00:00:00.000Z",
    "updatedAt": "2023-01-15T00:00:00.000Z"
  }
}
```

---

## AI API

### Get Suggestion

Provides AI-generated suggestions for feedback or reviews.

**Endpoint**: `POST /api/ai/suggest`

**Authentication Required**: Yes

**Request Body**:
```json
{
  "type": "feedback",
  "context": {
    "receiverId": "60d5ec66f10e8a001f4fcf1a",
    "goalId": "60d5ec66f10e8a001f4fcf2a"
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "suggestion": "Your recent work on the database migration project demonstrated excellent technical skills and attention to detail. I was particularly impressed by your proactive approach to identifying and resolving potential issues before they impacted users. In the future, consider documenting your process more thoroughly to help other team members learn from your approach."
  }
}
```

### Summarize Text

Summarizes long-form text into concise points.

**Endpoint**: `POST /api/ai/summarize`

**Authentication Required**: Yes

**Request Body**:
```json
{
  "text": "Over the past six months, I have worked on several projects including the database migration, UI redesign, and API optimization. For the database migration, I successfully planned and executed the transition from MySQL to MongoDB with minimal downtime. This involved creating a comprehensive migration strategy, developing data transformation scripts, and coordinating with multiple teams to ensure a smooth transition. The UI redesign project involved collaborating with the design team to implement a more intuitive user interface using React and Chakra UI. I led the front-end development effort and ensured that all components were responsive and accessible. For the API optimization project, I identified and resolved performance bottlenecks, resulting in a 40% reduction in response times and improved user experience."
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "summary": {
      "keyAchievements": [
        "Successfully migrated database from MySQL to MongoDB with minimal downtime",
        "Led front-end development for UI redesign using React and Chakra UI",
        "Optimized API performance, reducing response times by 40%"
      ],
      "projects": ["Database migration", "UI redesign", "API optimization"],
      "skills": ["Database migration", "Front-end development", "Performance optimization", "Cross-team coordination"],
      "overallSummary": "Demonstrated strong technical skills across multiple projects, with significant contributions to database migration, UI redesign, and API optimization. Shows ability to work across the stack and collaborate with different teams."
    }
  }
}
```

### Generate Review Draft

Generates a draft review based on historical data.

**Endpoint**: `POST /api/ai/generate-draft`

**Authentication Required**: Yes

**Request Body**:
```json
{
  "revieweeId": "60d5ec66f10e8a001f4fcf1a",
  "reviewType": "peer",
  "cycleId": "60d5ec66f10e8a001f4fcf4a"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "draft": {
      "strengths": "John has consistently demonstrated excellent technical skills, particularly in database optimization and API design. His attention to detail on the recent migration project was outstanding, and he showed great initiative by proactively identifying and addressing potential issues before they impacted users.",
      "areasForImprovement": "While John's technical skills are strong, he could improve his documentation practices. More thorough documentation would facilitate knowledge sharing and help other team members learn from his approaches.",
      "goalsProgress": "John has made significant progress on his goals this period, particularly in improving system performance and reducing technical debt.",
      "overallAssessment": "John is a valuable team member who consistently delivers high-quality work. His technical expertise and problem-solving abilities are assets to the team."
    }
  }
}
```

---

## Analytics API

### Get Review Volume Data

Retrieves data about review volumes over time.

**Endpoint**: `GET /api/analytics/review-volume`

**Authentication Required**: Yes

**Required Role**: Manager or Admin

**Response**:
```json
{
  "success": true,
  "data": {
    "timeline": ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    "volumes": [12, 8, 15, 10, 18, 25],
    "totalReviews": 88,
    "averagePerMonth": 14.67,
    "completionRates": {
      "timeline": ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
      "rates": [92, 88, 95, 90, 93, 97]
    }
  }
}
```

### Get Feedback Frequency Data

Retrieves data about feedback frequency and patterns.

**Endpoint**: `GET /api/analytics/feedback-frequency`

**Authentication Required**: Yes

**Required Role**: Manager or Admin

**Response**:
```json
{
  "success": true,
  "data": {
    "timeline": ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    "frequency": [22, 18, 25, 20, 28, 35],
    "byDepartment": {
      "Engineering": [10, 8, 12, 9, 14, 18],
      "Marketing": [6, 5, 7, 6, 8, 10],
      "Sales": [6, 5, 6, 5, 6, 7]
    },
    "sentimentTrend": {
      "timeline": ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
      "sentiment": [0.65, 0.68, 0.72, 0.70, 0.75, 0.78]
    }
  }
}
```

---

## Organization API

### Get Direct Reports

Retrieves a list of direct reports for the current user.

**Endpoint**: `GET /api/org/direct-reports`

**Authentication Required**: Yes

**Required Role**: Manager or Admin

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "_id": "60d5ec66f10e8a001f4fcf1a",
      "name": "John Doe",
      "email": "user@example.com",
      "role": "employee",
      "department": "Engineering",
      "hireDate": "2022-01-15T00:00:00.000Z"
    },
    {
      "_id": "60d5ec66f10e8a001f4fcf1c",
      "name": "Sarah Johnson",
      "email": "sarah@example.com",
      "role": "employee",
      "department": "Engineering",
      "hireDate": "2022-03-10T00:00:00.000Z"
    }
  ]
}
```

### Get Org Chart

Retrieves the organizational structure.

**Endpoint**: `GET /api/org/org-chart`

**Authentication Required**: Yes

**Required Role**: Manager or Admin

**Response**:
```json
{
  "success": true,
  "data": {
    "_id": "60d5ec66f10e8a001f4fcf1d",
    "name": "Alice Thompson",
    "role": "admin",
    "children": [
      {
        "_id": "60d5ec66f10e8a001f4fcf1b",
        "name": "Jane Smith",
        "role": "manager",
        "department": "Engineering",
        "children": [
          {
            "_id": "60d5ec66f10e8a001f4fcf1a",
            "name": "John Doe",
            "role": "employee",
            "department": "Engineering"
          },
          {
            "_id": "60d5ec66f10e8a001f4fcf1c",
            "name": "Sarah Johnson",
            "role": "employee",
            "department": "Engineering"
          }
        ]
      }
    ]
  }
}
```

---

## Error Handling

The API uses standard HTTP status codes to indicate the success or failure of a request:

- `200 OK`: Request succeeded
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request parameters
- `401 Unauthorized`: Authentication required or failed
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server-side error

All error responses include a JSON body with details:

```json
{
  "success": false,
  "error": "Error message",
  "details": {
    "field": "Specific field with error",
    "code": "ERROR_CODE",
    "additionalInfo": "More details about the error"
  }
}
```

Common error codes:

- `INVALID_CREDENTIALS`: Username or password incorrect
- `TOKEN_EXPIRED`: JWT token has expired
- `INSUFFICIENT_PERMISSIONS`: User doesn't have required role
- `RESOURCE_NOT_FOUND`: Requested resource doesn't exist
- `VALIDATION_ERROR`: Request data validation failed
