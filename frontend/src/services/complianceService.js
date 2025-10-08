import api from './api';

const complianceService = {
  // יצירת דיווח עמידה
  createCompliance: async (complianceData) => {
    const response = await api.post('/api/v1/compliance/', complianceData);
    return response.data;
  },

  // קבלת דוח עמידה
  getComplianceReport: async (recommendationId, visitPeriod) => {
    const response = await api.get(
      `/api/v1/compliance/report?recommendation_id=${recommendationId}&visit_period=${visitPeriod}`
    );
    return response.data;
  },

  // קבלת עמידה לפי המלצה
  getComplianceByRecommendation: async (recommendationId) => {
    const response = await api.get(`/api/v1/compliance/${recommendationId}`);
    return response.data;
  },

  // עדכון עמידה
  updateCompliance: async (complianceId, complianceData) => {
    const response = await api.put(`/api/v1/compliance/${complianceId}`, complianceData);
    return response.data;
  },

  // מחיקת עמידה
  deleteCompliance: async (complianceId) => {
    const response = await api.delete(`/api/v1/compliance/${complianceId}`);
    return response.data;
  },
};

export default complianceService;