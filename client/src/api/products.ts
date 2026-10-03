import { apiClient } from './client';
import {
  Product,
  ProductFilterParams,
  ProductsResponse,
  CreateProductDto,
  UpdateProductDto,
} from '../types/product';

export const productsApi = {
  getAll: async (params?: ProductFilterParams): Promise<ProductsResponse> => {
    const res = await apiClient.get<ProductsResponse>('/products', { params });
    return res.data;
  },

  getById: async (id: number): Promise<{ product: Product }> => {
    const res = await apiClient.get<{ product: Product }>(`/products/${id}`);
    return res.data;
  },

  create: async (data: CreateProductDto): Promise<{ message: string; product: Product }> => {
    const res = await apiClient.post<{ message: string; product: Product }>('/products', data);
    return res.data;
  },

  update: async (
    id: number,
    data: UpdateProductDto
  ): Promise<{ message: string; product: Product }> => {
    const res = await apiClient.put<{ message: string; product: Product }>(`/products/${id}`, data);
    return res.data;
  },

  delete: async (id: number): Promise<{ message: string; product: Product }> => {
    const res = await apiClient.delete<{ message: string; product: Product }>(`/products/${id}`);
    return res.data;
  },
};
