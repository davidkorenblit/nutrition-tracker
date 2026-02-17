import api from './api';

const waterService = {
  // יצירת רישום מים חדש
  createWaterLog: async (amount_ml) => {
    const response = await api.post('/api/v1/water/', { amount_ml });
    return response.data;
  },

  // קבלת כל רישומי המים לתאריך מסוים
  getWaterLogs: async (date, clientId = null) => {
    let url = `/api/v1/water/logs?date=${date}`;
    if (clientId) url += `&client_id=${clientId}`;
    const response = await api.get(url);
    return response.data;
  },

  // קבלת סה"כ מים לתאריך מסוים
  getTotalWater: async (date, clientId = null) => {
    let url = `/api/v1/water/total?date=${date}`;
    if (clientId) url += `&client_id=${clientId}`;
    const response = await api.get(url);
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