import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { apiService, Cart } from '../services/api';
import { useAuth } from './AuthContext';

interface CartContextType {
  cart: Cart | null;
  isLoading: boolean;
  itemCount: number;
  totalPrice: number;
  totalOriginalPrice: number;
  totalDiscount: number;
  addToCart: (productId: string, quantity?: number) => Promise<boolean>;
  updateQuantity: (itemId: string, quantity: number) => Promise<boolean>;
  removeFromCart: (itemId: string) => Promise<boolean>;
  clearCart: () => Promise<boolean>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { isAuthenticated } = useAuth();

  const itemCount = cart?.itemCount || 0;
  const totalPrice = cart?.totalPrice || 0;
  const totalOriginalPrice = cart?.totalOriginalPrice || 0;
  const totalDiscount = cart?.totalDiscount || 0;

  // Load cart when user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      refreshCart();
    } else {
      setCart(null);
    }
  }, [isAuthenticated]);

  const refreshCart = async () => {
    if (!isAuthenticated) return;

    try {
      setIsLoading(true);
      const response = await apiService.getCart();
      if (response.success && response.data?.cart) {
        setCart(response.data.cart);
      }
    } catch (error) {
      console.error('Failed to load cart:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addToCart = async (productId: string, quantity: number = 1): Promise<boolean> => {
    if (!isAuthenticated) return false;

    try {
      setIsLoading(true);
      const response = await apiService.addToCart({ productId, quantity });
      
      if (response.success) {
        await refreshCart();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to add to cart:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const updateQuantity = async (itemId: string, quantity: number): Promise<boolean> => {
    if (!isAuthenticated) return false;

    try {
      setIsLoading(true);
      const response = await apiService.updateCartItemQuantity(itemId, quantity);
      
      if (response.success) {
        await refreshCart();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to update quantity:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const removeFromCart = async (itemId: string): Promise<boolean> => {
    if (!isAuthenticated) return false;

    try {
      setIsLoading(true);
      const response = await apiService.removeFromCart(itemId);
      
      if (response.success) {
        await refreshCart();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to remove from cart:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const clearCart = async (): Promise<boolean> => {
    if (!isAuthenticated) return false;

    try {
      setIsLoading(true);
      const response = await apiService.clearCart();
      
      if (response.success) {
        setCart(null);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to clear cart:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const value: CartContextType = {
    cart,
    isLoading,
    itemCount,
    totalPrice,
    totalOriginalPrice,
    totalDiscount,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    refreshCart,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};



