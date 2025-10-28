import axios from 'axios';
import type { User, UserResponse, UserQueryParams } from '@/types/user';

type SuccessResponse<T> = { data: T; meta?: any };
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL + '/api';

const userManagementApiClient = axios.create({
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

export const userManagementApi = {
  // Get users with query parameters (POST method with body)
  getUsers: async (params?: UserQueryParams): Promise<UserResponse> => {
    try {
      const response = await userManagementApiClient.post<SuccessResponse<UserResponse>>('users', params || {});
      return response.data.data;
    } catch (error) {
      handleApiError(error, 'Error fetching users');
      throw error;
    }
  },

  // Update user status (ACTIVE, INACTIVE, DELETED)
  updateUserStatus: async (id: string, status: string): Promise<User> => {
    try {
      const response = await userManagementApiClient.patch<SuccessResponse<User>>(`users/${id}/status`, { status });
      return response.data.data;
    } catch (error) {
      handleApiError(error, `Error updating user status ${id}`);
      throw error;
    }
  },
};

export default userManagementApi;

