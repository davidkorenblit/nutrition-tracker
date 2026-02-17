import api from './api';

const weeklyService = {
  // יצירת הערות שבועיות
  createWeeklyNotes: async (notesData) => {
    const response = await api.post('/api/v1/weekly/', notesData);
    return response.data;
  },

  // קבלת כל ההערות השבועיות
  getAllNotes: async (weekStartDate = null, clientId = null) => {
    let url = '/api/v1/weekly/';
    const params = [];
    if (weekStartDate) params.push(`week_start_date=${weekStartDate}`);
    if (clientId) params.push(`client_id=${clientId}`);
    if (params.length > 0) url += '?' + params.join('&');
    const response = await api.get(url);
    return response.data;
  },

  // קבלת הערה ספציפית
  getNoteById: async (notesId) => {
    const response = await api.get(`/api/v1/weekly/${notesId}`);
    return response.data;
  },

  // עדכון הערות
  updateNotes: async (notesId, notesData) => {
    const response = await api.put(`/api/v1/weekly/${notesId}`, notesData);
    return response.data;
  },

  // מחיקת הערות
  deleteNotes: async (notesId) => {
    const response = await api.delete(`/api/v1/weekly/${notesId}`);
    return response.data;
  },
};

export default weeklyService;