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
  async getLatestCheck(clientId = null) {
    let url = '/api/v1/compliance/latest';
    if (clientId) url += `?client_id=${clientId}`;
    const response = await api.get(url);
    return response.data;
  },

  /**
   * Get compliance check history
   */
  async getCheckHistory(limit = 10, clientId = null) {
    let url = `/api/v1/compliance/history?limit=${limit}`;
    if (clientId) url += `&client_id=${clientId}`;
    const response = await api.get(url);
    return response.data;
  },

  /**
   * Get scores summary (for charts/graphs)
   */
  async getScoresSummary(limit = 5, clientId = null) {
    let url = `/api/v1/compliance/summary?limit=${limit}`;
    if (clientId) url += `&client_id=${clientId}`;
    const response = await api.get(url);
    return response.data;
  },

  /**
   * Check if auto-check is due
   */
  async checkIfDue(clientId = null) {
    let url = '/api/v1/compliance/auto-check-due';
    if (clientId) url += `?client_id=${clientId}`;
    const response = await api.get(url);
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