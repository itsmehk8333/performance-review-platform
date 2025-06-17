import axios from 'axios';

const API_URL =  'https://performance-review-platform.onrender.com/';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Auth API
export const loginUser = (credentials) => api.post('/auth/login', credentials);
export const getCurrentUser = () => api.get('/auth/me');

// Goals API
export const getGoals = (params) => api.get('/goals', { params });
export const getGoalById = (id) => api.get(`/goals/${id}`);
export const createGoal = (goal) => api.post('/goals', goal);
export const updateGoalProgress = (id, data) => api.patch(`/goals/${id}/progress`, data);
export const deleteGoal = (id) => api.delete(`/goals/${id}`);
export const addGoalTags = (id, tags) => api.patch(`/goals/${id}/tags`, { tags });
export const addGoalComment = (id, text) => api.post(`/goals/${id}/comments`, { text });

// Feedback API
export const getFeedback = (params) => api.get('/feedback', { params });
export const createFeedback = (feedback) => api.post('/feedback', feedback);
export const getFeedbackTags = () => api.get('/feedback/tags');
export const exportFeedback = async (params) => {
  const response = await api.get('/feedback/export', { 
    params,
    responseType: 'blob'
  });
  
  // Create a download link and trigger it
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `feedback-export.${params.format || 'csv'}`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  
  return response;
};

// Reviews API
export const getReviewCycles = async () => {
  try {
    return await api.get('/reviews/cycles');
  } catch (error) {
    console.error('Error fetching review cycles:', error);
    return { data: [] };
  }
};
export const getReviewCycle = (id) => api.get(`/reviews/cycles/${id}`);
export const createReviewCycle = (cycle) => api.post('/reviews/cycles', cycle);
export const updateReviewCycle = (id, cycle) => api.put(`/reviews/cycles/${id}`, cycle);
export const deleteReviewCycle = (id) => api.delete(`/reviews/cycles/${id}`);
export const advanceReviewCycle = (id) => api.post(`/reviews/cycles/${id}/advance`);
export const getReviews = (params) => api.get('/reviews', { params });
export const getReview = (id) => api.get(`/reviews/${id}`);
export const assignReviews = (data) => api.post('/reviews/assign', data);
export const submitReview = (id, data) => api.post(`/reviews/${id}/submit`, data);
export const calibrateReview = (id, data) => api.post(`/reviews/${id}/calibrate`, data);
export const exportReviews = async (params) => {
  const response = await api.get('/reviews/export', { 
    params,
    responseType: 'blob'
  });
  
  // Create a download link and trigger it
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `reviews-export.${params.format || 'csv'}`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  
  return response;
};
export const exportReviewPDF = async (id) => {
  const response = await api.get(`/reviews/${id}/export`, { 
    responseType: 'blob'
  });
  
  // Create a download link and trigger it
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `review-${id}.pdf`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  
  return response;
};

// New Approval System API endpoints
export const approveReview = (id) => api.post(`/reviews/${id}/approve`);
export const rejectReview = (id, reason) => api.post(`/reviews/${id}/reject`, { rejectionReason: reason });
export const getPendingApprovals = () => api.get('/reviews/pending-approvals');
export const configurePhases = (id, phases) => api.post(`/reviews/cycles/${id}/configure-phases`, { phases });
export const startCycle = (id) => api.post(`/reviews/cycles/${id}/start`);
export const advancePhase = (id) => api.post(`/reviews/cycles/${id}/advance-phase`);
export const assignAutoReviews = (cycleId, phase) => api.post('/reviews/assign-auto', { cycleId, phase });
export const getReportReviews = (userId) => api.get(`/reviews/reports/${userId}`);
export const processWorkflows = () => api.post('/reviews/process-workflows');

// Org Chart API endpoints
export const getDirectReports = () => api.get('/org/direct-reports');
export const getAllReports = () => api.get('/org/all-reports');
export const updateUserManager = (userId, managerId) => api.put(`/org/update-manager/${userId}`, { managerId });
export const updateUserDepartment = (userId, department) => api.put(`/org/update-department/${userId}`, { department });
export const bulkUpdateOrgData = (updates) => api.put('/org/bulk-update', { updates });
export const importOrgChart = (csvData) => api.post('/org/import-csv', { csvData });
export const getOrgChart = () => api.get('/org/org-chart');

// Review Templates API
export const getReviewTemplates = () => api.get('/templates');
export const getReviewTemplate = (id) => api.get(`/templates/${id}`);
export const createReviewTemplate = (template) => api.post('/templates', template);
export const updateReviewTemplate = (id, template) => api.put(`/templates/${id}`, template);
export const deleteReviewTemplate = (id) => api.delete(`/templates/${id}`);

// AI API
export const getSuggestion = (data) => api.post('/ai/suggest', data);
export const summarizeText = (text) => api.post('/ai/summarize', { text });
export const generateReviewDraft = (data) => api.post('/ai/generate-draft', data);

// Analytics API
export const getReviewVolumeData = () => api.get('/analytics/review-volume');
export const getFeedbackFrequencyData = () => api.get('/analytics/feedback-frequency');

// Users API
export const getUsers = async () => {
  try {
    return await api.get('/auth/users');
  } catch (error) {
    console.error('Error fetching users:', error);
    return { data: [] };
  }
};

// Sentiment Analysis API
export const recalculateSentiment = (id) => api.post(`/reviews/${id}/recalculate-sentiment`);
export const getSentimentComparison = (id) => api.get(`/reviews/${id}/sentiment-comparison`);

export default api;
