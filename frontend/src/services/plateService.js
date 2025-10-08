import api from './api';

const plateService = {
  // יצירת צלחת חופשית
  createPlate: async (plateData) => {
    const response = await api.post('/api/v1/plates/', plateData);
    return response.data;
  },

  // קבלת צלחות של ארוחה
  getPlatesByMeal: async (mealId) => {
    const response = await api.get(`/api/v1/plates/${mealId}`);
    return response.data;
  },
};

export default plateService;