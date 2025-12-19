import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'api';

const settingsApiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

const handleApiError = (error: any, context: string) => {
  if (axios.isAxiosError(error)) {
    const errorMessage = error.response?.data?.error || error.message;
    console.error(`${context}:`, errorMessage);
    throw new Error(errorMessage);
  }
  console.error(`${context}:`, error);
  throw error;
};

export const settingsApi = {
  // Get settings
  getSettings: async (): Promise<any> => {
    try {
      const response = await settingsApiClient.get('/business-admin/settings');
      return response.data;
    } catch (error) {
      handleApiError(error, 'Error fetching settings');
      throw error;
    }
  },

  // Update settings
  updateSettings: async (settings: any): Promise<any> => {
    try {
      const response = await settingsApiClient.put('/business-admin/settings', settings);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Error updating settings');
      throw error;
    }
  },

  // Update specific setting
  updateSetting: async (key: string, value: any): Promise<any> => {
    try {
      const response = await settingsApiClient.patch(`/business-admin/settings/${key}`, { value });
      return response.data;
    } catch (error) {
      handleApiError(error, `Error updating setting ${key}`);
      throw error;
    }
  },

  // Reset settings to default
  resetSettings: async (): Promise<void> => {
    try {
      await settingsApiClient.post('/business-admin/settings/reset');
    } catch (error) {
      handleApiError(error, 'Error resetting settings');
      throw error;
    }
  },
};

export default settingsApi;

