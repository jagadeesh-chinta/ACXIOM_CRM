import api from './api';

export const opportunityService = {
  getOpportunities: async (params = {}) => {
    const res = await api.get('/opportunities', { params });
    return res.data;
  },

  getOpportunityById: async (id) => {
    const res = await api.get(`/opportunities/${id}`);
    return res.data;
  },

  createOpportunity: async (opportunityData) => {
    const res = await api.post('/opportunities', opportunityData);
    return res.data;
  },

  updateOpportunity: async (id, opportunityData) => {
    const res = await api.put(`/opportunities/${id}`, opportunityData);
    return res.data;
  },

  deleteOpportunity: async (id) => {
    const res = await api.delete(`/opportunities/${id}`);
    return res.data;
  }
};
