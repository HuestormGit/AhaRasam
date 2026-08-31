import { createContext, useState, useEffect } from "react";

export const CartContext = createContext();

const STORAGE_KEY = "cartList";

const readStoredCart = () => {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(stored) ? stored : [];
  } catch {
    return []; // corrupted/blocked storage — start empty rather than crash
  }
};

export const CartProvider = ({ children }) => {
  // Read synchronously on first render: loading in an effect races the save
  // effect below and wipes the stored cart on mount (twice over, in StrictMode).
  const [cart, setCart] = useState(readStoredCart);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  }, [cart]);

  // ✅ Smarter addToCart (merge qty if product+size exists)
  const addToCart = (item) => {
    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex(
        (p) => p.productId === item.productId && p.size === item.size
      );

      if (existingIndex >= 0) {
        return prevCart.map((p, i) =>
          i === existingIndex ? { ...p, qty: p.qty + item.qty } : p
        );
      } else {
        return [...prevCart, item];
      }
    });
  };

  const removeFromCart = (index) => {
    setCart((prevCart) => prevCart.filter((_, i) => i !== index));
  };

  const clearCart = () => setCart([]);

  return (
    <CartContext.Provider
      value={{ cart, setCart, addToCart, removeFromCart, clearCart }}
    >
      {children}
    </CartContext.Provider>
  );
};
