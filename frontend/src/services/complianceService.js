import api from './api';

const complianceService = {
  /**
   * Trigger a new compliance check
   */
  async runComplianceCheck(periodStart, periodEnd) {
    const response = await api.post('/api/v1/compliance/check', {
      period_start: periodStart,
      period_end: periodEnd
    });
    return response.data;
  },

  /**
   * Get the latest compliance check
   */
  async getLatestCheck() {
    const response = await api.get('/api/v1/compliance/latest');
    return response.data;
  },

  /**
   * Get compliance check history
   */
  async getCheckHistory(limit = 10) {
    const response = await api.get(`/api/v1/compliance/history?limit=${limit}`);
    return response.data;
  },

  /**
   * Get scores summary (for charts/graphs)
   */
  async getScoresSummary(limit = 5) {
    const response = await api.get(`/api/v1/compliance/summary?limit=${limit}`);
    return response.data;
  },

  /**
   * Check if auto-check is due
   */
  async checkIfDue() {
    const response = await api.get('/api/v1/compliance/auto-check-due');
    return response.data;
  },

  /**
   * Delete a compliance check
   */
  async deleteCheck(complianceId) {
    const response = await api.delete(`/api/v1/compliance/${complianceId}`);
    return response.data;
  },
};

export default complianceService;