import { apiClient } from './client';
import { AuthResponse, LoginDto, RegisterDto, RegisterResponse } from '../types/auth';
import { User } from '../types/user';

export const authApi = {
  login: async (data: LoginDto): Promise<AuthResponse> => {
    const res = await apiClient.post<AuthResponse>('/auth/login', data);
    return res.data;
  },

  register: async (data: RegisterDto): Promise<RegisterResponse> => {
    const res = await apiClient.post<RegisterResponse>('/auth/register', data);
    return res.data;
  },

  refresh: async (): Promise<AuthResponse> => {
    const res = await apiClient.post<AuthResponse>('/auth/refresh');
    return res.data;
  },

  logout: async (): Promise<{ message: string }> => {
    const res = await apiClient.post<{ message: string }>('/auth/logout');
    return res.data;
  },

  getMe: async (): Promise<{ user: User }> => {
    const res = await apiClient.get<{ user: User }>('/auth/me');
    return res.data;
  },
};
