import api from './api';

export const customerPortalService = {
  getProfile: async () => {
    const res = await api.get('/customer-portal/profile');
    return res.data;
  },

  getRequests: async () => {
    const res = await api.get('/customer-portal/requests');
    return res.data;
  },

  createRequest: async (requestData) => {
    const res = await api.post('/customer-portal/requests', requestData);
    return res.data;
  },

  updateRequest: async (id, data) => {
    const res = await api.patch(`/customer-portal/requests/${id}`, data);
    return res.data;
  },

  updateProfile: async (data) => {
    const res = await api.put('/customer-portal/profile', data);
    return res.data;
  }
};
