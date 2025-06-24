import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Riders API
export const ridersAPI = {
  getAll: (page = 1, limit = 10) => api.get(`/riders?page=${page}&limit=${limit}`),
  getById: (id) => api.get(`/riders/${id}`),
  create: (data) => api.post('/riders', data),
  update: (id, data) => api.put(`/riders/${id}`, data),
  delete: (id) => api.delete(`/riders/${id}`),
};

// Swaps API
export const swapsAPI = {
  getAll: (page = 1, limit = 10) => api.get(`/swaps?page=${page}&limit=${limit}`),
  create: (data) => api.post('/swaps', data),
  getAnalytics: (startDate, endDate) => api.get(`/swaps/analytics?startDate=${startDate}&endDate=${endDate}`),
};

// Analytics API
export const analyticsAPI = {
  getDashboard: () => api.get('/analytics/dashboard'),
  getChurnPredictions: () => api.get('/analytics/churn-predictions'),
  getSwapForecast: (location, days) => api.get(`/analytics/forecast?location=${location}&days=${days}`),
};

export default api;