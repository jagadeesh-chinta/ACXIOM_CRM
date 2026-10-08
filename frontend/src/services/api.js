import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle unauthenticated 401 responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const isAuthRoute = window.location.pathname.startsWith('/login') || 
                          window.location.pathname.startsWith('/register');
      if (!isAuthRoute) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login?sessionExpired=true';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
