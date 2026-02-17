import api from './api';

const snackService = {
  // יצירת חטיף
  createSnack: async (snackData) => {
    const response = await api.post('/api/v1/snacks/', snackData);
    return response.data;
  },

  // קבלת חטיפים (עם פילטר תאריך אופציונלי)
  getSnacks: async (date = null, clientId = null) => {
    let url = '/api/v1/snacks/';
    const params = [];
    if (date) params.push(`date=${date}`);
    if (clientId) params.push(`client_id=${clientId}`);
    if (params.length > 0) url += '?' + params.join('&');
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