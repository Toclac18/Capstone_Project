import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'api';

const reportsApiClient = axios.create({
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

export const reportsApi = {
  // Get all reports
  getReports: async (params?: any): Promise<any[]> => {
    try {
      const queryString = params 
        ? '?' + new URLSearchParams(Object.entries(params).reduce((acc, [key, value]) => ({ ...acc, [key]: String(value) }), {})).toString()
        : '';
      
      const response = await reportsApiClient.get(`/business-admin/reports${queryString}`);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Error fetching reports');
      throw error;
    }
  },

  // Get report by ID
  getReportById: async (id: string): Promise<any> => {
    try {
      const response = await reportsApiClient.get(`/business-admin/reports/${id}`);
      return response.data;
    } catch (error) {
      handleApiError(error, `Error fetching report ${id}`);
      throw error;
    }
  },

  // Generate report
  generateReport: async (config?: any): Promise<any> => {
    try {
      const response = await reportsApiClient.post('/business-admin/reports/generate', config);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Error generating report');
      throw error;
    }
  },

  // Download report
  downloadReport: async (id: string): Promise<Blob> => {
    try {
      const response = await reportsApiClient.get(`/business-admin/reports/${id}/download`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      handleApiError(error, `Error downloading report ${id}`);
      throw error;
    }
  },

  // Delete report
  deleteReport: async (id: string): Promise<void> => {
    try {
      await reportsApiClient.delete(`/business-admin/reports/${id}`);
    } catch (error) {
      handleApiError(error, `Error deleting report ${id}`);
      throw error;
    }
  },
};

export default reportsApi;

