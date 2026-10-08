import api from './api';

export const followupService = {
  getFollowups: async (params = {}) => {
    const res = await api.get('/followups', { params });
    return res.data;
  },

  createFollowup: async (followupData) => {
    const res = await api.post('/followups', followupData);
    return res.data;
  },

  updateFollowup: async (id, followupData) => {
    const res = await api.put(`/followups/${id}`, followupData);
    return res.data;
  },

  deleteFollowup: async (id) => {
    const res = await api.delete(`/followups/${id}`);
    return res.data;
  }
};
