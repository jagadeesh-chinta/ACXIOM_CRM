import api from './api';

export const activityService = {
  getActivities: async (params = {}) => {
    const res = await api.get('/activities', { params });
    return res.data;
  },

  createActivity: async (activityData) => {
    const res = await api.post('/activities', activityData);
    return res.data;
  },

  updateActivity: async (id, activityData) => {
    const res = await api.put(`/activities/${id}`, activityData);
    return res.data;
  },

  deleteActivity: async (id) => {
    const res = await api.delete(`/activities/${id}`);
    return res.data;
  }
};
