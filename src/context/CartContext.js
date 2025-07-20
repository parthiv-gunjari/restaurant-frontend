// src/context/CartContext.js
import React, { createContext, useContext, useState } from 'react';
import axios from 'axios';

const CartContext = createContext();
export const useCart = () => useContext(CartContext);

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);

  const addToCart = (item) => {
    setCartItems(prev => {
      const existing = prev.find(i => i._id === item._id);
      if (existing) {
        return prev.map(i =>
          i._id === item._id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (id) => {
    setCartItems(prev => prev.filter(i => i._id !== id));
  };

  const updateQuantity = (id, qty) => {
    setCartItems(prev =>
      prev.map(i => i._id === id ? { ...i, quantity: qty } : i)
    );
  };

  const incrementItem = (item) => {
    setCartItems(prev => {
      const existing = prev.find(i => i._id === item._id);
      if (existing) {
        return prev.map(i =>
          i._id === item._id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const decrementItem = (item) => {
    setCartItems(prev => {
      const existing = prev.find(i => i._id === item._id);
      if (!existing) return prev;

      if (existing.quantity === 1) {
        return prev.filter(i => i._id !== item._id);
      }

      return prev.map(i =>
        i._id === item._id ? { ...i, quantity: i.quantity - 1 } : i
      );
    });
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const getQuantity = (id) => {
    const item = cartItems.find(i => i._id === id);
    return item ? item.quantity : 0;
  };

  const placeOrder = async () => {
    if (cartItems.length === 0) return;

    const orderPayload = {
      items: cartItems
    };

    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/orders`, orderPayload);
      clearCart();
      return res.data.order; // for displaying order.id in alert
    } catch (err) {
      console.error("Error placing order:", err);
      throw err;
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart: cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        incrementItem,
        decrementItem,
        placeOrder,
        clearCart,
        getQuantity
      }}
    >
      {children}
    </CartContext.Provider>
  );
}