import axios from 'axios';

const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
});

export const healthCheck = () => api.get('/health');

export const uploadDataset = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const loadSampleDataset = () => api.post('/load-sample');

export const runAnalysis = (mapping = null) =>
  api.post('/analyze', mapping);

export const getDashboard = () => api.get('/dashboard');

export const getEda = () => api.get('/eda');
export const getSentiment = () => api.get('/sentiment');
export const getTopics = () => api.get('/topics');
export const getPriorities = () => api.get('/priorities');
export const getTrends = () => api.get('/trends');
export const getComparison = () => api.get('/comparison');
export const getSummaries = () => api.get('/summaries');
export const getReviews = (params) => api.get('/reviews', { params });

export default api;
