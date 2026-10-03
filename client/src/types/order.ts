import { Product } from './product';
import { User } from './user';

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

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
  createdAt: string;
  updatedAt: string;
  userId: number;
  user?: User;
  items: OrderItem[];
}

export interface UpdateOrderStatusDto {
  status: OrderStatus;
}
