import api from './api';

export const authService = {
  login: async (credentials) => {
    const res = await api.post('/auth/login', credentials);
    return res.data;
  },

  register: async (userData) => {
    const res = await api.post('/auth/register', userData);
    return res.data;
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // Continue cleanup on client
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  },

  getCurrentUser: async () => {
    const res = await api.get('/auth/me');
    return res.data;
  },

  forgotPassword: async (email) => {
    const res = await api.post('/auth/forgot-password', { email });
    return res.data;
  },

  resetPassword: async (payload) => {
    const res = await api.post('/auth/reset-password', payload);
    return res.data;
  },

  checkAdminStatus: async () => {
    const res = await api.get('/auth/admin-status');
    return res.data;
  },

  registerAdmin: async (adminData) => {
    const res = await api.post('/auth/admin-register', adminData);
    return res.data;
  },

  registerManager: async (managerData) => {
    const res = await api.post('/auth/manager-register', managerData);
    return res.data;
  },

  registerSalesExec: async (salesData) => {
    const res = await api.post('/auth/sales-register', salesData);
    return res.data;
  },

  getPublicStats: async () => {
    const res = await api.get('/auth/public-stats');
    return res.data;
  }
};
