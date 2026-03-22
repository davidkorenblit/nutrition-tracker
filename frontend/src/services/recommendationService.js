import api from './api';

const API_BASE = '/api/v1/recommendations';

const recommendationService = {
  /**
   * העלאת קובץ Word עם המלצות
   * משדרת FormData עם הקובץ, ו-visit_date כ-query parameter
   */
 uploadRecommendations: async (visitDate, file) => {
  const formattedDate = new Date(visitDate).toISOString().split('T')[0];

  const formData = new FormData();
  formData.append('file', file);

  // api instance already injects baseURL + Authorization header via interceptor
  return api.post(
    `/api/v1/recommendations/upload?visit_date=${formattedDate}`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  ).then(r => r.data);
},

  /**
   * קבל את כל ההמלצות של המשתמש
   */
  getAllRecommendations: async (clientId = null) => {
    let url = API_BASE;
    if (clientId) url += `?client_id=${clientId}`;
    const response = await api.get(url);
    return response.data;
  },

  /**
   * קבל המלצה ספציפית
   */
  getRecommendation: async (id) => {
    const response = await api.get(`${API_BASE}/${id}`);
    return response.data;
  },

  /**
   * עדכן תיוג של פריט המלצה
   */
  tagRecommendationItem: async (recommendationId, tagUpdate) => {
    const response = await api.put(
      `${API_BASE}/${recommendationId}/tag`,
      tagUpdate
    );
    return response.data;
  },

  /**
   * מחק המלצה
   */
  deleteRecommendation: async (id) => {
    const response = await api.delete(`${API_BASE}/${id}`);
    return response.data;
  },
};

export default recommendationService;