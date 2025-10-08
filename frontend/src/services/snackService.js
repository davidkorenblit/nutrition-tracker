import api from './api';

const snackService = {
  // יצירת חטיף
  createSnack: async (snackData) => {
    const response = await api.post('/api/v1/snacks/', snackData);
    return response.data;
  },

  // קבלת חטיפים (עם פילטר תאריך אופציונלי)
  getSnacks: async (date = null) => {
    const url = date ? `/api/v1/snacks/?date=${date}` : '/api/v1/snacks/';
    const response = await api.get(url);
    return response.data;
  },

  // מחיקת חטיף
  deleteSnack: async (snackId) => {
    const response = await api.delete(`/api/v1/snacks/${snackId}`);
    return response.data;
  },
};

export default snackService;