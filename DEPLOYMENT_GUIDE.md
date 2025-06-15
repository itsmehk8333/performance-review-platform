# Deployment Guide

This document provides detailed instructions for deploying the Performance Review Platform to production environments.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Frontend Deployment (Netlify)](#frontend-deployment-netlify)
4. [Backend Deployment (Render)](#backend-deployment-render)
5. [Database Setup (MongoDB Atlas)](#database-setup-mongodb-atlas)
6. [Environment Variables](#environment-variables)
7. [Troubleshooting](#troubleshooting)

---

## Overview

The Performance Review Platform is deployed using a combination of cloud services:

- **Frontend**: Hosted on Netlify (React SPA)
- **Backend API**: Hosted on Render (Node.js/Express)
- **Database**: MongoDB Atlas (Cloud MongoDB)

This guide covers the step-by-step process to deploy each component.

---

## Prerequisites

Before beginning the deployment process, ensure you have:

1. A GitHub repository with the project code
2. Accounts on:
   - Netlify
   - Render
   - MongoDB Atlas
3. OpenAI API key for AI features
4. Domain name (optional, for custom domains)

---

## Frontend Deployment (Netlify)

### Step 1: Prepare Your Frontend Code

Ensure your React application is ready for production:

1. Update the API base URL in `client/src/utils/api.js` to point to your production backend
2. Create or verify `.env.production` file with:
   ```
   REACT_APP_API_URL=https://your-backend-url.render.com/api
   ```
3. Create or verify the `netlify.toml` file in the client directory:
   ```toml
   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200
   ```
4. Create or verify the `_redirects` file in the client/public directory:
   ```
   /* /index.html 200
   ```

### Step 2: Deploy to Netlify

#### Option 1: Netlify UI

1. Log in to Netlify
2. Click "New site from Git"
3. Connect to your GitHub repository
4. Configure build settings:
   - Base directory: `performance-review-platform/client`
   - Build command: `npm run build`
   - Publish directory: `build`
5. Add environment variables from `.env.production`
6. Click "Deploy site"

#### Option 2: Netlify CLI

1. Install Netlify CLI: `npm install -g netlify-cli`
2. Authenticate: `netlify login`
3. Navigate to client directory: `cd performance-review-platform/client`
4. Build the project: `npm run build`
5. Deploy: `netlify deploy --prod`

### Step 3: Verify Frontend Deployment

1. Open the Netlify deployment URL
2. Test the login page and navigation
3. Verify that the site loads without routing errors

---

## Backend Deployment (Render)

### Step 1: Prepare Your Backend Code

1. Ensure your `package.json` has a start script:
   ```json
   "scripts": {
     "start": "node index.js",
     "dev": "nodemon index.js"
   }
   ```

2. Create a `render.yaml` file in the server directory (optional):
   ```yaml
   services:
     - type: web
       name: performance-review-platform
       env: node
       buildCommand: npm install
       startCommand: npm start
       envVars:
         - key: MONGO_URI
           sync: false
         - key: JWT_SECRET
           sync: false
         - key: OPENAI_API_KEY
           sync: false
   ```

### Step 2: Deploy to Render

#### Option 1: Render UI

1. Log in to Render
2. Click "New Web Service"
3. Connect to your GitHub repository
4. Configure the service:
   - Name: `performance-review-platform`
   - Root Directory: `performance-review-platform/server`
   - Environment: `Node`
   - Build Command: `npm install`
   - Start Command: `npm start`
5. Add environment variables:
   - `MONGO_URI`: Your MongoDB Atlas connection string
   - `JWT_SECRET`: A secure random string
   - `OPENAI_API_KEY`: Your OpenAI API key
   - `PORT`: 10000 (Render default)
6. Click "Create Web Service"

#### Option 2: Using render.yaml

1. If you created a `render.yaml` file, you can use Render's "Blueprint" feature
2. In Render, go to "Blueprints"
3. Connect to your repository
4. Render will automatically detect the configuration and set up the service

### Step 3: Configure CORS for the Backend

Ensure your Express server has CORS configured to allow requests from your Netlify domain:

```javascript
const cors = require('cors');

// Configured CORS
app.use(cors({
  origin: ['https://your-netlify-app.netlify.app', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

### Step 4: Verify Backend Deployment

1. Test the API using Postman or cURL:
   ```
   curl https://your-backend.render.com/api
   ```
2. Verify that you receive the expected response: `API is running...`

---

## Database Setup (MongoDB Atlas)

### Step 1: Create MongoDB Atlas Cluster

1. Log in to MongoDB Atlas
2. Create a new project (if needed)
3. Build a new cluster:
   - Choose a cloud provider and region
   - Select cluster tier (M0 Free Tier is sufficient for starting)
   - Name your cluster

### Step 2: Configure Database Access

1. Create a database user:
   - Go to "Database Access" under Security
   - Add a new database user with password authentication
   - Set appropriate permissions (readWrite on your database)

2. Configure network access:
   - Go to "Network Access" under Security
   - Add your IP address
   - For production, you can allow access from anywhere (0.0.0.0/0)

### Step 3: Get Connection String

1. Click "Connect" on your cluster
2. Choose "Connect your application"
3. Copy the connection string
4. Replace `<password>` with your database user's password
5. Add this as the `MONGO_URI` environment variable in Render

### Step 4: Seed the Database

After deployment, you can seed the database with initial data:

1. Temporarily add a seed endpoint to your API (or use an existing one)
2. Secure it with an admin key
3. Trigger the seeding process via API call
4. Alternatively, run the seed script locally with the production MongoDB URI:
   ```
   MONGO_URI=your_atlas_uri npm run seed
   ```

---

## Environment Variables

### Frontend (Netlify) Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `REACT_APP_API_URL` | URL of the backend API | `https://performance-review-platform.onrender.com/api` |

### Backend (Render) Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGO_URI` | MongoDB Atlas connection string | `mongodb+srv://username:password@cluster.mongodb.net/performance-review?retryWrites=true&w=majority` |
| `JWT_SECRET` | Secret for JWT authentication | `your-secure-random-string` |
| `OPENAI_API_KEY` | OpenAI API key for AI features | `sk-...` |
| `PORT` | Port for the server (Render sets this automatically) | `10000` |

---

## Troubleshooting

### Common Deployment Issues

#### Frontend Issues

1. **Page Not Found Errors**:
   - Verify that the `netlify.toml` and `_redirects` files are correctly configured
   - Check that the files are in the correct directories

2. **API Connection Errors**:
   - Verify that the `REACT_APP_API_URL` is correct
   - Check CORS configuration on the backend
   - Test API endpoints independently

#### Backend Issues

1. **Failed Deployments**:
   - Check build logs for errors
   - Verify that all dependencies are listed in package.json
   - Ensure start command is correct

2. **Database Connection Errors**:
   - Verify MongoDB Atlas network access settings
   - Check that the connection string is correct
   - Ensure database user has correct permissions

3. **API Errors**:
   - Check environment variables
   - Verify JWT secret is set
   - Check for runtime errors in logs

### Monitoring and Logs

1. **Netlify Logs**:
   - Access via Netlify Dashboard > Your Site > Deploys > Deployment Detail

2. **Render Logs**:
   - Access via Render Dashboard > Your Service > Logs

3. **MongoDB Atlas Logs**:
   - Access via Atlas Dashboard > Clusters > ... > Monitoring

### Getting Support

If you encounter issues not covered here:

1. Check the GitHub repository issues
2. Review service-specific documentation:
   - [Netlify Documentation](https://docs.netlify.com/)
   - [Render Documentation](https://render.com/docs)
   - [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
3. Contact the development team
