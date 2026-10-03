import { apiClient } from './client';
import { Cart, CartItem, AddToCartDto, UpdateCartItemDto } from '../types/cart';

export const cartApi = {
  get: async (): Promise<{ cart: Cart }> => {
    const res = await apiClient.get<{ cart: Cart }>('/cart');
    return res.data;
  },

  addItem: async (data: AddToCartDto): Promise<{ message: string; item: CartItem }> => {
    const res = await apiClient.post<{ message: string; item: CartItem }>('/cart/items', data);
    return res.data;
  },

  updateItem: async (
    itemId: number,
    data: UpdateCartItemDto
  ): Promise<{ message: string; item: CartItem }> => {
    const res = await apiClient.put<{ message: string; item: CartItem }>(
      `/cart/items/${itemId}`,
      data
    );
    return res.data;
  },

  removeItem: async (itemId: number): Promise<{ message: string }> => {
    const res = await apiClient.delete<{ message: string }>(`/cart/items/${itemId}`);
    return res.data;
  },
};
