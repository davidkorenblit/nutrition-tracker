import axios from 'axios';

// Log the exact URL being used during initialization for debugging (e.g. if Production missed the env var)
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
console.log('API Base URL configured as:', API_BASE_URL);

// יצירת instance של Axios עם הגדרות בסיס
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 seconds timeout to prevent infinite hanging
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Enable sending credentials (cookies, auth headers) with requests
});

// Interceptor - מוסיף אוטומטית את ה-token לכל בקשה
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor - מטפל בשגיאות אוטומטית
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log error details for debugging
    if (error.response) {
      // Server responded with error status
      console.error(`API Error [${error.response.status}]:`, error.response.data);
      
      if (error.response.status === 401) {
        // Unauthorized - token expired or invalid
        localStorage.removeItem('access_token');
        window.location.href = '/login';
      } else if (error.response.status === 500) {
        // Server error - log for debugging
        console.error('Server Error (500):', error.response.data);
      }
    } else if (error.request) {
      // Request made but no response received
      console.error('No response from server:', error.request);
    } else {
      // Error in request setup
      console.error('Error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default api;