const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Import routes
const authRoutes = require('./routes/auth');
const goalRoutes = require('./routes/goals');
const feedbackRoutes = require('./routes/feedback');
const reviewRoutes = require('./routes/reviews');
const templateRoutes = require('./routes/templates');
const aiRoutes = require('./routes/ai');
const orgRoutes = require('./routes/org'); // New org chart routes

// Import middleware
const { auth } = require('./middleware/auth');

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/goals', auth, goalRoutes);
app.use('/api/feedback', auth, feedbackRoutes);
app.use('/api/reviews', auth, reviewRoutes);
app.use('/api/templates', auth, templateRoutes);
app.use('/api/ai', auth, aiRoutes);
app.use('/api/org', auth, orgRoutes); // New org chart API

// Default route
app.get('/', (req, res) => {
  res.send('API is running...');
});

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
