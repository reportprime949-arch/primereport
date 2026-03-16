import axios from 'axios';

const API_BASE_URL = 'http://localhost:4000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Mocking auth for now as we don't have a login flow yet
// In a real app, this would come from a context or local storage
api.interceptors.request.use((config) => {
  config.headers.Authorization = `Bearer mock-token`;
  return config;
});

export const newsApi = {
  getHero: () => api.get('/news/hero'),
  getTrending: () => api.get('/news/trending'),
  getBreaking: () => api.get('/news/breaking'),
  getArticles: (category = 'all', page = 1, limit = 12) => 
    api.get(`/news?category=${category}&page=${page}&limit=${limit}`),
  getArticle: (id) => api.get(`/news/${id}`),
  getRelatedArticles: (id) => api.get(`/news/${id}/related`),
};

export const adminApi = {
  getStats: () => api.get('/admin/stats'),
  getArticles: () => api.get('/admin/articles'),
  createArticle: (data) => api.post('/admin/articles', data),
  updateArticle: (id, data) => api.put(`/admin/articles/${id}`, data),
  deleteArticle: (id) => api.delete(`/admin/articles/${id}`),
  getRssFeeds: () => api.get('/admin/rss'),
  addRssFeed: (data) => api.post('/admin/rss', data),
  syncRss: () => api.post('/admin/rss-sync'),
  getNotifications: () => api.get('/admin/notifications'),
};

export default api;
