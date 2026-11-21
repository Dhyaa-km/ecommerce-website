import { apiClient } from './client';
import { Order, UpdateOrderStatusDto, CheckoutSessionResponse, MockPaymentResponse } from '../types/order';

export const ordersApi = {
  create: async (): Promise<{ message: string; order: Order }> => {
    const res = await apiClient.post<{ message: string; order: Order }>('/orders');
    return res.data;
  },

  createCheckoutSession: async (orderId: number): Promise<CheckoutSessionResponse> => {
    const res = await apiClient.post<CheckoutSessionResponse>('/orders/checkout', {
      orderId,
    });
    return res.data;
  },

  confirmMockPayment: async (sessionId: string): Promise<MockPaymentResponse> => {
    const res = await apiClient.post<MockPaymentResponse>('/orders/checkout/confirm-mock', {
      sessionId,
    });
    return res.data;
  },

  cancelMockPayment: async (sessionId: string): Promise<MockPaymentResponse> => {
    const res = await apiClient.post<MockPaymentResponse>('/orders/checkout/cancel-mock', {
      sessionId,
    });
    return res.data;
  },

  getMyOrders: async (): Promise<{ orders: Order[] }> => {
    const res = await apiClient.get<{ orders: Order[] }>('/orders/my');
    return res.data;
  },

  getById: async (id: number): Promise<{ order: Order }> => {
    const res = await apiClient.get<{ order: Order }>(`/orders/${id}`);
    return res.data;
  },

  // Admin endpoints
  getAll: async (): Promise<{ orders: Order[] }> => {
    const res = await apiClient.get<{ orders: Order[] }>('/orders');
    return res.data;
  },

  updateStatus: async (
    id: number,
    data: UpdateOrderStatusDto
  ): Promise<{ message: string; order: Order }> => {
    const res = await apiClient.patch<{ message: string; order: Order }>(
      `/orders/${id}/status`,
      data
    );
    return res.data;
  },
};
