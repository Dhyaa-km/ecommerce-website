import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Cart } from '../types/cart';
import { cartApi } from '../api/cart';
import { useAuth } from './AuthContext';

interface CartContextType {
  cart: Cart | null;
  itemCount: number;
  subtotal: number;
  isLoading: boolean;
  error: string | null;
  fetchCart: () => Promise<void>;
  addToCart: (productId: number, quantity?: number) => Promise<void>;
  updateQuantity: (itemId: number, quantity: number) => Promise<void>;
  removeItem: (itemId: number) => Promise<void>;
  clearCartState: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const clearCartState = useCallback(() => {
    setCart(null);
    setError(null);
  }, []);

  const fetchCart = useCallback(async () => {
    if (!isAuthenticated) {
      clearCartState();
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const data = await cartApi.get();
      setCart(data.cart);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      }
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, clearCartState]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
    } else {
      clearCartState();
    }
  }, [isAuthenticated, fetchCart, clearCartState]);

  const addToCart = async (productId: number, quantity: number = 1) => {
    setError(null);
    try {
      await cartApi.addItem({ productId, quantity });
      await fetchCart();
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : 'Failed to add item to cart';
      throw new Error(message || 'Failed to add item to cart');
    }
  };

  const updateQuantity = async (itemId: number, quantity: number) => {
    setError(null);
    try {
      await cartApi.updateItem(itemId, { quantity });
      await fetchCart();
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : 'Failed to update item quantity';
      throw new Error(message || 'Failed to update item quantity');
    }
  };

  const removeItem = async (itemId: number) => {
    setError(null);
    try {
      await cartApi.removeItem(itemId);
      await fetchCart();
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : 'Failed to remove item';
      throw new Error(message || 'Failed to remove item');
    }
  };

  const itemCount = cart?.items.reduce((total, item) => total + item.quantity, 0) || 0;
  const subtotal =
    cart?.items.reduce(
      (total, item) => total + Number(item.product.price) * item.quantity,
      0
    ) || 0;

  return (
    <CartContext.Provider
      value={{
        cart,
        itemCount,
        subtotal,
        isLoading,
        error,
        fetchCart,
        addToCart,
        updateQuantity,
        removeItem,
        clearCartState,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
