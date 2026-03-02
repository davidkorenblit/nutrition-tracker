import api from './api';

const authService = {
  // רישום משתמש חדש
  register: async (userData) => {
    try {
      console.log('Attempting registration for:', userData.email);
      const response = await api.post('/api/v1/auth/register', userData);
      console.log('Registration successful:', response.data);
      return response.data;
    } catch (error) {
      console.error('Registration error:', error.response?.data || error.message);
      throw error;
    }
  },

  // התחברות
  login: async (credentials) => {
    try {
      console.log('Attempting login for:', credentials.email);
      console.log('API Base URL:', api.defaults.baseURL);
      const response = await api.post('/api/v1/auth/login', credentials);
      
      if (response.data.access_token) {
        console.log('Login successful, storing token');
        localStorage.setItem('access_token', response.data.access_token);
      }
      return response.data;
    } catch (error) {
      console.error('Login error details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
        headers: error.response?.headers,
      });
      throw error;
    }
  },

  // התנתקות
  logout: () => {
    console.log('Logging out user');
    localStorage.removeItem('access_token');
  },

  // קבלת פרטי המשתמש המחובר
  getProfile: async () => {
    try {
      const response = await api.get('/api/v1/auth/me');
      return response.data;
    } catch (error) {
      console.error('Get profile error:', error.response?.data || error.message);
      throw error;
    }
  },

  // בדיקה אם המשתמש מחובר
  isAuthenticated: () => {
    return !!localStorage.getItem('access_token');
  },

  // קבלת כל המשתמשים (למנהלים)
  getAllUsers: async () => {
    try {
      const response = await api.get('/api/v1/auth/users');
      return response.data;
    } catch (error) {
      console.error('Get all users error:', error.response?.data || error.message);
      throw error;
    }
  },
};

export default authService;