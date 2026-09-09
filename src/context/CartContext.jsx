import { createContext, useState, useEffect } from "react";

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);

  // Load cart from localStorage on page load
  useEffect(() => {
    const storedCart = JSON.parse(localStorage.getItem("cartList")) || [];
    setCart(storedCart);
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("cartList", JSON.stringify(cart));
  }, [cart]);

  // ✅ Smarter addToCart (merge qty if product+size exists)
  const addToCart = (item) => {
    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex(
        (p) => p.productId === item.productId && p.size === item.size
      );

      if (existingIndex >= 0) {
        const updatedCart = [...prevCart];
        updatedCart[existingIndex].qty += item.qty;
        return updatedCart;
      } else {
        return [...prevCart, item];
      }
    });
  };

  const removeFromCart = (index) => {
    setCart((prevCart) => prevCart.filter((_, i) => i !== index));
  };

  return (
    <CartContext.Provider value={{ cart, setCart, addToCart, removeFromCart }}>
      {children}
    </CartContext.Provider>
  );
};
