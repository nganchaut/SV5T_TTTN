import { apiClient } from './apiClient';
import { SystemConfig } from '../types';

const systemService = {
  getSettings: async (): Promise<SystemConfig> => {
    const response = await apiClient.get('/api/settings/');
    return response.data;
  },

  updateSettings: async (settings: Partial<SystemConfig>): Promise<SystemConfig> => {
    const response = await apiClient.post('/api/settings/', settings);
    return response.data;
  }
};

export default systemService;
