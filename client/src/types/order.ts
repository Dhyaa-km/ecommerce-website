import { Product } from './product';
import { User } from './user';

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
export type PaymentStatus = 'UNPAID' | 'PAID' | 'FAILED' | 'REFUNDED';

export interface OrderItem {
  id: number;
  quantity: number;
  unitPrice: number | string;
  orderId: number;
  productId: number;
  product?: Product;
}

export interface Order {
  id: number;
  status: OrderStatus;
  paymentStatus?: PaymentStatus;
  paymentSessionId?: string | null;
  paymentExpiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
  userId: number;
  user?: User;
  items: OrderItem[];
}

export interface CheckoutSessionResponse {
  message: string;
  checkoutUrl: string;
}

export interface MockPaymentResponse {
  message: string;
  order: Order;
}

export interface CreateCheckoutSessionDto {
  orderId: number;
}

export interface UpdateOrderStatusDto {
  status: OrderStatus;
}
