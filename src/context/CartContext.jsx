import { createContext, useState, useEffect } from "react";

export const CartContext = createContext();

const STORAGE_KEY = "cartList";

const isModernCartItem = (item) =>
  item &&
  typeof item === "object" &&
  !Array.isArray(item) &&
  typeof item.productDocumentId === "string" &&
  !!item.productDocumentId.trim() &&
  typeof item.variantDocumentId === "string" &&
  !!item.variantDocumentId.trim() &&
  Number.isSafeInteger(item.qty) &&
  item.qty > 0;

const sameLine = (left, right) =>
  left.productDocumentId === right.productDocumentId &&
  left.variantDocumentId === right.variantDocumentId;

const readStoredCart = () => {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(stored) ? stored.filter(isModernCartItem) : [];
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

  // Stable Strapi document IDs define a line; size/name/price are display only.
  const addToCart = (item) => {
    setCart((prevCart) => {
      if (!isModernCartItem(item)) return prevCart;
      const existingIndex = prevCart.findIndex((p) => sameLine(p, item));

      if (existingIndex >= 0) {
        return prevCart.map((p, i) =>
          i === existingIndex ? { ...p, qty: p.qty + item.qty } : p
        );
      } else {
        return [...prevCart, item];
      }
    });
  };

  const updateQuantity = (productDocumentId, variantDocumentId, qty) =>
    setCart((prevCart) =>
      Number.isSafeInteger(qty) && qty > 0
        ? prevCart.map((item) =>
            sameLine(item, { productDocumentId, variantDocumentId })
              ? { ...item, qty }
              : item
          )
        : prevCart
    );

  const removeFromCart = (productDocumentId, variantDocumentId) =>
    setCart((prevCart) =>
      prevCart.filter(
        (item) => !sameLine(item, { productDocumentId, variantDocumentId })
      )
    );

  const clearCart = () => setCart([]);

  return (
    <CartContext.Provider
      value={{
        cart,
        setCart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
