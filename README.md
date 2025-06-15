# AI-Driven Performance Review Platform

An enterprise-ready, AI-augmented platform that simplifies performance management for HR teams, managers, and employees.

## Live Demo

- **Frontend**: [https://gorgeous-bienenstitch-932b3b.netlify.app/login](https://gorgeous-bienenstitch-932b3b.netlify.app/login)
- **Backend API**: [https://performance-review-platform.onrender.com/api](https://performance-review-platform.onrender.com/api)

### Demo Credentials
- **Admin**: admin@example.com / password123
- **Manager**: manager@example.com / password123
- **Employee**: employee1@example.com / password123 or employee2@example.com / password123

## Features

- OKR & Goal Management (Create, assign, and track goals)
- Continuous Feedback Module
- 360° Performance Reviews
- Manager-Report Chain Logic
- Analytics & Exports (CSV, PDF)
- AI-Powered Add-ons (Auto-Generated Reviews, Sentiment Analysis)
- Role-Based Access Control (Admin, Manager, Employee)
- Mobile-responsive UI with clean, modern design

## Tech Stack

- **Frontend**: React, Chakra UI
- **Backend**: Node.js, Express
- **Database**: MongoDB (Mongoose)
- **Authentication**: JWT
- **AI**: OpenAI API for suggestions and sentiment analysis

## Project Structure

```
performance-review-platform/
├── client/                 # React frontend
│   ├── public/
│   └── src/
│       ├── components/     # Reusable UI components
│       ├── context/        # Context providers (Auth)
│       ├── pages/          # Page components
│       └── utils/          # Utility functions & API client
│
└── server/                 # Express backend
    ├── config/             # Configuration files
    ├── middleware/         # Express middleware
    ├── models/             # Mongoose models
    └── routes/             # API routes
```

## Getting Started

### Prerequisites

- Node.js (v14+)
- MongoDB
- OpenAI API key

### Installation

1. Clone the repository
2. Install dependencies

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

3. Configure environment variables

Create a `.env` file in the server directory:

```
MONGO_URI=mongodb://localhost:27017/performance-review
JWT_SECRET=your_jwt_secret_here
OPENAI_API_KEY=your_openai_api_key_here
PORT=5000
```

4. Seed the database with initial data

```bash
cd server
npm run seed
```

5. Start the development servers

```bash
# Start the backend server
cd server
npm run dev

# In a new terminal, start the frontend
cd client
npm start
```

The application will be available at `http://localhost:3000`.

## Default Users

After running the seed script, you can log in with the following credentials:

- **Admin**: admin@example.com / password123
- **Manager**: manager@example.com / password123
- **Employee**: employee1@example.com / password123 or employee2@example.com / password123

## Main Features

### 1. Authentication & Role-Based Access Control

- JWT-based secure login
- Role-based authorization (Admin, Manager, Employee)
- Protected routes based on user roles

### 2. Goal Management

- Create and track goals at company, department, team, and individual levels
- Progress tracking with visual indicators
- Hierarchical goal structure with parent-child relationships

### 3. Continuous Feedback

- Provide feedback on specific goals
- Real-time feedback that's visible to both the giver and receiver
- AI-powered sentiment analysis and feedback suggestions

### 4. 360° Performance Reviews

- Full review cycle management
- Self, peer, manager, and upward reviews
- Comprehensive performance rating system
- In-depth review details with visualizations

### 5. Export Capabilities

- Export reviews and feedback in CSV and PDF formats
- Detailed individual review exports
- Customizable export options with filtering

### 6. AI Integration

- AI-generated feedback suggestions
- Sentiment analysis for written feedback
- Assistance in writing effective reviews

## User Roles

### Admin
- Manage users and roles
- Create and manage review cycles
- Assign reviews
- Access all platform features

### Manager
- Create and assign goals for team members
- Review direct reports
- Export team performance data
- Request upward feedback

### Employee
- View and update assigned goals
- Provide peer feedback
- Complete assigned reviews
- Track personal performance

## Testing the Application

### Local Testing

To test the application locally and ensure all features are working properly:

1. Make sure MongoDB is running locally
2. Seed the database with sample data:
   ```
   cd server
   npm run seed
   ```
3. Start both the server and client:
   ```
   cd server
   npm run dev
   ```
   In a new terminal:
   ```
   cd client
   npm start
   ```
4. Login with one of the following accounts:
   - Admin: admin@example.com / password123
   - Manager: manager@example.com / password123
   - Employee: employee1@example.com / password123

5. Test the following features:
   - **Goal Management**: Create, view, and update goals
   - **Feedback**: Provide and receive feedback
   - **Reviews**: Navigate through review cycles and submit reviews
   - **Exports**: Export reviews and feedback data (Manager/Admin only)

### Deployment

The application is deployed and available online:

- **Frontend**: Deployed on Netlify at [https://gorgeous-bienenstitch-932b3b.netlify.app](https://gorgeous-bienenstitch-932b3b.netlify.app)
- **Backend**: Deployed on Render at [https://performance-review-platform.onrender.com/api](https://performance-review-platform.onrender.com/api)
- **Database**: MongoDB Atlas cloud database

#### Deployment Configuration

- The frontend uses Netlify's SPA redirect configuration (see `netlify.toml` and `_redirects` files)
- The backend API is configured to accept CORS requests from the Netlify domain
- Environment variables are configured in each platform's deployment settings

## Troubleshooting

If you encounter any issues:

1. **API Connection Issues**: Ensure the server is running on port 5000 and the client is configured with the proxy setting
2. **Authentication Problems**: Check that the JWT_SECRET is set in the .env file
3. **Database Errors**: Verify MongoDB is running and accessible at the URI specified in .env
4. **Missing Features**: Ensure you're logged in with the appropriate role to access role-specific features

## License

[MIT](LICENSE)
