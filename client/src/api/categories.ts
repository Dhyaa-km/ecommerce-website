import { apiClient } from './client';
import { Category, CreateCategoryDto } from '../types/category';

export const categoriesApi = {
  getAll: async (): Promise<{ categories: Category[] }> => {
    const res = await apiClient.get<{ categories: Category[] }>('/categories');
    return res.data;
  },

  create: async (data: CreateCategoryDto): Promise<{ message: string; category: Category }> => {
    const res = await apiClient.post<{ message: string; category: Category }>('/categories', data);
    return res.data;
  },
};
