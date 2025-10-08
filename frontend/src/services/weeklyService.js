import api from './api';

const weeklyService = {
  // יצירת הערות שבועיות
  createWeeklyNotes: async (notesData) => {
    const response = await api.post('/api/v1/weekly/', notesData);
    return response.data;
  },

  // קבלת כל ההערות השבועיות
  getAllNotes: async (weekStartDate = null) => {
    const url = weekStartDate 
      ? `/api/v1/weekly/?week_start_date=${weekStartDate}` 
      : '/api/v1/weekly/';
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