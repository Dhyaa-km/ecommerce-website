import { Product } from './product';

export interface CartItem {
  id: number;
  quantity: number;
  cartId: number;
  productId: number;
  product: Product;
}

export interface Cart {
  id: number;
  userId: number;
  createdAt: string;
  updatedAt: string;
  items: CartItem[];
}

export interface AddToCartDto {
  productId: number;
  quantity: number;
}

export interface UpdateCartItemDto {
  quantity: number;
}
