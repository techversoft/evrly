'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import api from '../utils/api';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { data: session, status } = useSession();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load cart
  const fetchCart = async () => {
    try {
      setLoading(true);
      if (status === 'authenticated') {
        const { data } = await api.get('/cart');
        setCartItems(data.items || []);
      } else {
        const localCart = localStorage.getItem('evrly_customized_giftstore_cart');
        setCartItems(localCart ? JSON.parse(localCart) : []);
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status !== 'loading') {
      fetchCart();
    }
  }, [session, status]);

  // Sync guest cart to local storage
  const syncLocalCart = (items) => {
    setCartItems(items);
    localStorage.setItem('evrly_customized_giftstore_cart', JSON.stringify(items));
  };

  // Add Item
  const addItemToCart = async (product, quantity, customizationValues) => {
    try {
      if (status === 'authenticated') {
        const { data } = await api.post('/cart', {
          productId: product._id,
          quantity,
          customizationValues,
        });
        setCartItems(data.items || []);
      } else {
        // Local storage guest logic
        const items = [...cartItems];
        const existingIndex = items.findIndex(
          (item) =>
            item.product._id === product._id &&
            JSON.stringify(item.customizationValues) === JSON.stringify(customizationValues)
        );

        if (existingIndex > -1) {
          items[existingIndex].quantity += quantity;
        } else {
          items.push({
            _id: `guest_${Math.random().toString(36).substring(2, 9)}`,
            product,
            quantity,
            customizationValues,
          });
        }
        syncLocalCart(items);
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      throw error;
    }
  };

  // Update Quantity / Customization
  const updateCartItem = async (itemId, quantity, customizationValues) => {
    try {
      if (status === 'authenticated') {
        const { data } = await api.put(`/cart/items/${itemId}`, {
          quantity,
          customizationValues,
        });
        setCartItems(data.items || []);
      } else {
        const items = cartItems.map((item) => {
          if (item._id === itemId) {
            return {
              ...item,
              quantity: quantity !== undefined ? quantity : item.quantity,
              customizationValues: customizationValues !== undefined ? customizationValues : item.customizationValues,
            };
          }
          return item;
        });
        syncLocalCart(items);
      }
    } catch (error) {
      console.error('Error updating cart item:', error);
    }
  };

  // Remove Item
  const removeItemFromCart = async (itemId) => {
    try {
      if (status === 'authenticated') {
        const { data } = await api.delete(`/cart/items/${itemId}`);
        setCartItems(data.items || []);
      } else {
        const items = cartItems.filter((item) => item._id !== itemId);
        syncLocalCart(items);
      }
    } catch (error) {
      console.error('Error removing cart item:', error);
    }
  };

  // Clear Cart
  const clearCart = async () => {
    try {
      if (status === 'authenticated') {
        await api.delete('/cart');
      }
      setCartItems([]);
      localStorage.removeItem('evrly_customized_giftstore_cart');
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
  };

  // Calculations
  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  
  const cartSubtotal = cartItems.reduce((acc, item) => {
    const price = item.product?.price || 0;
    return acc + price * item.quantity;
  }, 0);

  const cartShipping = cartSubtotal > 500 || cartSubtotal === 0 ? 0 : 50;
  const cartTotal = cartSubtotal + cartShipping;

  return (
    <CartContext.Provider
      value={{
        cartItems,
        loading,
        cartCount,
        cartSubtotal,
        cartShipping,
        cartTotal,
        addItemToCart,
        updateCartItem,
        removeItemFromCart,
        clearCart,
        refreshCart: fetchCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
