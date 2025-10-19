import api from './api';

const complianceService = {
  /**
   * Get compliance report for a recommendation
   */
  async getComplianceReport(recommendationId, visitPeriod) {
    const response = await api.get(
      `/api/v1/compliance/report?recommendation_id=${recommendationId}&visit_period=${visitPeriod}`
    );
    return response.data;
  },

  /**
   * Create compliance entry
   */
  async createCompliance(complianceData) {
    const response = await api.post('/api/v1/compliance/', complianceData);
    return response.data;
  },

  /**
   * Update compliance entry
   */
  async updateCompliance(complianceId, complianceData) {
    const response = await api.put(`/api/v1/compliance/${complianceId}`, complianceData);
    return response.data;
  },

  /**
   * Delete compliance entry
   */
  async deleteCompliance(complianceId) {
    const response = await api.delete(`/api/v1/compliance/${complianceId}`);
    return response.data;
  },
};

export default complianceService;