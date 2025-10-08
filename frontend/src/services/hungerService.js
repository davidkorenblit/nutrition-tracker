import api from './api';

const hungerService = {
  // יצירת רישום רעב
  createHungerLog: async (hungerData) => {
    const response = await api.post('/api/v1/hunger-logs/', hungerData);
    return response.data;
  },

  // קבלת רישומי רעב לארוחה
  getHungerLogsByMeal: async (mealId) => {
    const response = await api.get(`/api/v1/hunger-logs/${mealId}`);
    return response.data;
  },
};

export default hungerService;