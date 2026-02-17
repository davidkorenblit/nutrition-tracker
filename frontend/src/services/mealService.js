import api from './api';

const mealService = {
  // קבלת כל הארוחות (עם פילטר תאריך אופציונלי)
  getMeals: async (date = null, clientId = null) => {
    let url = '/api/v1/meals/';
    const params = [];
    if (date) params.push(`date=${date}`);
    if (clientId) params.push(`client_id=${clientId}`);
    if (params.length > 0) url += '?' + params.join('&');
    const response = await api.get(url);
    return response.data;
  },

  // קבלת ארוחה ספציפית
  getMeal: async (mealId) => {
    const response = await api.get(`/api/v1/meals/${mealId}`);
    return response.data;
  },

  // יצירת ארוחה מלאה (צלחות + רעב)
  completeMeal: async (mealData) => {
    const response = await api.post('/api/v1/meals/complete', mealData);
    return response.data;
  },

  // עדכון ארוחה
  updateMeal: async (mealId, mealData) => {
    const response = await api.put(`/api/v1/meals/${mealId}`, mealData);
    return response.data;
  },

  // מחיקת ארוחה
  deleteMeal: async (mealId) => {
    const response = await api.delete(`/api/v1/meals/${mealId}`);
    return response.data;
  },
};

export default mealService;