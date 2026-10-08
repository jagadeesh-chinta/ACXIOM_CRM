import api from './api';

export const dashboardService = {
  getAdminDashboard: async () => {
    const res = await api.get('/dashboard/admin');
    return res.data;
  },

  getManagerDashboard: async () => {
    const res = await api.get('/dashboard/manager');
    return res.data;
  },

  getSalesDashboard: async () => {
    const res = await api.get('/dashboard/sales');
    return res.data;
  },

  getCustomerDashboard: async () => {
    const res = await api.get('/dashboard/customer');
    return res.data;
  }
};
