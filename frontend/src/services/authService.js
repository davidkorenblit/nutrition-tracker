import api from './api';

const authService = {
  // רישום משתמש חדש
  register: async (userData) => {
    try {
      const response = await api.post('/api/v1/auth/register', userData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // התחברות
  login: async (credentials) => {
    try {
      const response = await api.post('/api/v1/auth/login', credentials);
      
      if (response.data.access_token) {
        localStorage.setItem('access_token', response.data.access_token);
      }
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // התנתקות
  logout: () => {
    localStorage.removeItem('access_token');
  },

  // קבלת פרטי המשתמש המחובר
  getProfile: async () => {
    try {
      const response = await api.get('/api/v1/auth/me');
      return response.data;
    } catch (error) {
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
      throw error;
    }
  },
};

export default authService;