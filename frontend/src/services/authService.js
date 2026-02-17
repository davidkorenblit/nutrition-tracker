import api from './api';

const authService = {
  // רישום משתמש חדש
  register: async (userData) => {
    const response = await api.post('/api/v1/auth/register', userData);
    return response.data;
  },

  // התחברות
  login: async (credentials) => {
    const response = await api.post('/api/v1/auth/login', credentials);
    if (response.data.access_token) {
      localStorage.setItem('access_token', response.data.access_token);
    }
    return response.data;
  },

  // התנתקות
  logout: () => {
    localStorage.removeItem('access_token');
  },

  // קבלת פרטי המשתמש המחובר
  getProfile: async () => {
    const response = await api.get('/api/v1/auth/me');
    return response.data;
  },

  // בדיקה אם המשתמש מחובר
  isAuthenticated: () => {
    return !!localStorage.getItem('access_token');
  },

  // קבלת כל המשתמשים (למנהלים)
  getAllUsers: async () => {
    const response = await api.get('/api/v1/auth/users');
    return response.data;
  },
};

export default authService;