import api from './api';

export const reportService = {
  getCustomerReport: async (params = {}) => {
    const res = await api.get('/reports/customers', { params });
    return res.data;
  },

  getLeadReport: async (params = {}) => {
    const res = await api.get('/reports/leads', { params });
    return res.data;
  },

  getFollowupReport: async (params = {}) => {
    const res = await api.get('/reports/followups', { params });
    return res.data;
  },

  getOpportunityReport: async (params = {}) => {
    const res = await api.get('/reports/opportunities', { params });
    return res.data;
  },

  getPipelineReport: async (params = {}) => {
    const res = await api.get('/reports/pipeline', { params });
    return res.data;
  },

  getConversionReport: async (params = {}) => {
    const res = await api.get('/reports/conversion', { params });
    return res.data;
  },

  getActivityReport: async (params = {}) => {
    const res = await api.get('/reports/activity', { params });
    return res.data;
  },

  getAuditReport: async (params = {}) => {
    const res = await api.get('/reports/audit', { params });
    return res.data;
  },

  exportCSVUrl: (endpoint, params = {}) => {
    const base = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const query = new URLSearchParams({ ...params, format: 'csv' }).toString();
    return `${base}/reports/${endpoint}?${query}`;
  }
};
