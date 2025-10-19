import api from './api';
import axios from 'axios';

const API_URL = 'http://localhost:8000/api/v1/recommendations';

const recommendationService = {
  /**
   * העלאת קובץ Word עם המלצות
   * משדרת FormData עם הקובץ, ו-visit_date כ-query parameter
   */
 uploadRecommendations: async (visitDate, file) => {
  const formattedDate = new Date(visitDate).toISOString().split('T')[0];
  
  const formData = new FormData();
  formData.append('file', file);
  
  const token = localStorage.getItem('access_token');

  return axios.post(
    `http://localhost:8000/api/v1/recommendations/upload?visit_date=${formattedDate}`,
    formData,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  ).then(r => r.data);
},

  /**
   * קבל את כל ההמלצות של המשתמש
   */
  getAllRecommendations: async () => {
    const response = await api.get(API_URL);
    return response.data;
  },

  /**
   * קבל המלצה ספציפית
   */
  getRecommendation: async (id) => {
    const response = await api.get(`${API_URL}/${id}`);
    return response.data;
  },

  /**
   * עדכן תיוג של פריט המלצה
   */
  tagRecommendationItem: async (recommendationId, tagUpdate) => {
    const response = await api.put(
      `${API_URL}/${recommendationId}/tag`,
      tagUpdate
    );
    return response.data;
  },

  /**
   * מחק המלצה
   */
  deleteRecommendation: async (id) => {
    const response = await api.delete(`${API_URL}/${id}`);
    return response.data;
  },
};

export default recommendationService;