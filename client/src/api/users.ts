import { apiClient } from './client';
import { User, UpdateUserProfileDto, UpdateUserPasswordDto } from '../types/user';

export const usersApi = {
  getMe: async (): Promise<{ user: User }> => {
    const res = await apiClient.get<{ user: User }>('/users/me');
    return res.data;
  },

  updateMe: async (
    data: UpdateUserProfileDto
  ): Promise<{ message: string; user: User }> => {
    const res = await apiClient.put<{ message: string; user: User }>('/users/me', data);
    return res.data;
  },

  updatePassword: async (data: UpdateUserPasswordDto): Promise<{ message: string }> => {
    const res = await apiClient.put<{ message: string }>('/users/me/password', data);
    return res.data;
  },

  // Admin endpoints
  getAll: async (): Promise<{ users: User[] }> => {
    const res = await apiClient.get<{ users: User[] }>('/users');
    return res.data;
  },

  updateStatus: async (
    id: number,
    isActive: boolean
  ): Promise<{ message: string; user: User }> => {
    const res = await apiClient.patch<{ message: string; user: User }>(`/users/${id}/status`, {
      isActive,
    });
    return res.data;
  },
};
