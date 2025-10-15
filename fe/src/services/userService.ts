import axios, { AxiosResponse } from 'axios';
import type { User, CreateUserData } from '../types/user';

// API Base Configuration - pointing to our Next.js API routes
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'api';
const API_TIMEOUT = parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || '10000');

// Create Axios instance for user service
const userApiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
  // Ensure cookies are sent with requests (for access_token)
  withCredentials: true,
});

// Helper function to handle API errors
const handleApiError = (error: any, context: string) => {
  if (axios.isAxiosError(error)) {
    const errorMessage = error.response?.data?.error || error.message;
    console.error(`${context}:`, errorMessage);
    throw new Error(errorMessage);
  }
  console.error(`${context}:`, error);
  throw error;
};

// User service functions
export const userService = {
  // Get all users
  getUsers: async (): Promise<User[]> => {
    try {
      const response: AxiosResponse<User[]> = await userApiClient.get('/users');
      return response.data;
    } catch (error) {
      handleApiError(error, 'Error fetching users');
      throw error; // TypeScript requires this
    }
  },

  // Get user by ID
  getUserById: async (id: string): Promise<User> => {
    try {
      const response: AxiosResponse<User> = await userApiClient.get(`/users/${id}`);
      return response.data;
    } catch (error) {
      handleApiError(error, `Error fetching user ${id}`);
      throw error;
    }
  },

  // Create new user
  createUser: async (userData: CreateUserData): Promise<User> => {
    try {
      const response: AxiosResponse<User> = await userApiClient.post('/users', userData);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Error creating user');
      throw error;
    }
  },

}

export default userService;
