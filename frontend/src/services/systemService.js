import api from './api';

export const systemService = {
  getHealth: async () => {
    const res = await api.get('/system/health');
    return res.data;
  },

  getSettings: async () => {
    const res = await api.get('/system/settings');
    return res.data;
  },

  updateSetting: async (setting_key, setting_value) => {
    const res = await api.put('/system/settings', { setting_key, setting_value });
    return res.data;
  },

  getAuditLogs: async (params = {}) => {
    const res = await api.get('/audit', { params });
    return res.data;
  }
};
