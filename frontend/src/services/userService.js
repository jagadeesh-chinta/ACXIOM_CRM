import api from './api';

export const userService = {
  getUsers: async (params = {}) => {
    const res = await api.get('/users', { params });
    return res.data;
  },

  getRoles: async () => {
    const res = await api.get('/users/roles');
    return res.data;
  },

  createUser: async (userData) => {
    const res = await api.post('/users', userData);
    return res.data;
  },

  updateUser: async (id, userData) => {
    const res = await api.put(`/users/${id}`, userData);
    return res.data;
  },

  updateUserStatus: async (id, status) => {
    const res = await api.patch(`/users/${id}/status`, { status });
    return res.data;
  },

  resetPassword: async (id, new_password) => {
    const res = await api.post(`/users/${id}/reset-password`, { new_password });
    return res.data;
  }
};
