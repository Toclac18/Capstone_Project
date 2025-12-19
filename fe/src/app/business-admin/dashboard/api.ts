import axios from 'axios';
import type { User } from '@/types/user';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'api';

const dashboardApiClient = axios.create({
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

export const dashboardApi = {
  // Get all users for dashboard
  getUsers: async (): Promise<User[]> => {
    try {
      const response = await dashboardApiClient.get<User[]>('/users');
      return response.data;
    } catch (error) {
      handleApiError(error, 'Error fetching users');
      throw error;
    }
  },

  // Get dashboard statistics
  getStatistics: async (): Promise<any> => {
    try {
      const response = await dashboardApiClient.get('/business-admin/dashboard/statistics');
      return response.data;
    } catch (error) {
      handleApiError(error, 'Error fetching statistics');
      throw error;
    }
  },
};

export default dashboardApi;

