import api from './api';

const recommendationService = {
  // העלאת קובץ Word עם המלצות
  uploadRecommendations: async (visitDate, file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post(
      `/api/v1/recommendations/upload?visit_date=${visitDate}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  // קבלת כל ההמלצות
  getAllRecommendations: async () => {
    const response = await api.get('/api/v1/recommendations/');
    return response.data;
  },

  // קבלת המלצה ספציפית
  getRecommendation: async (recommendationId) => {
    const response = await api.get(`/api/v1/recommendations/${recommendationId}`);
    return response.data;
  },

  // תיוג המלצה (סיווג ידני)
  tagRecommendation: async (recommendationId, tagData) => {
    const response = await api.put(
      `/api/v1/recommendations/${recommendationId}/tag`,
      tagData
    );
    return response.data;
  },

  // מחיקת המלצה
  deleteRecommendation: async (recommendationId) => {
    const response = await api.delete(`/api/v1/recommendations/${recommendationId}`);
    return response.data;
  },
};

export default recommendationService;