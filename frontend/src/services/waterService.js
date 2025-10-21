import api from './api';

const waterService = {
  // יצירת רישום מים חדש
  createWaterLog: async (amount_ml) => {
    const response = await api.post('/api/v1/water/', { amount_ml });
    return response.data;
  },

  // קבלת כל רישומי המים לתאריך מסוים
  getWaterLogs: async (date) => {
    const response = await api.get(`/api/v1/water/logs?date=${date}`);
    return response.data;
  },

  // קבלת סה"כ מים לתאריך מסוים
  getTotalWater: async (date) => {
    const response = await api.get(`/api/v1/water/total?date=${date}`);
    return response.data;
  },

  // מחיקת רישום מים
  deleteWaterLog: async (logId) => {
    const response = await api.delete(`/api/v1/water/${logId}`);
    return response.data;
  },

  // עדכון רישום מים
  updateWaterLog: async (logId, amount_ml) => {
    const response = await api.put(`/api/v1/water/${logId}`, { amount_ml });
    return response.data;
  },
};

export default waterService;