import { createContext, useCallback, useEffect, useRef, useState } from "react";
import { fetchDataFromApi } from "../utils/Api";

export const CartContext = createContext();

const STORAGE_KEY = "cartList";

// Mirrors the backend's per-line cap, so merging two stale duplicate rows can
// never produce a quantity the quote endpoint will reject.
export const MAX_QUANTITY_PER_LINE = 100;

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

// A published, active variant whose product relation we can actually trust.
const isCatalogueVariant = (variant) =>
  !!variant &&
  typeof variant.documentId === "string" &&
  !!variant.documentId.trim() &&
  typeof variant.sku === "string" &&
  !!variant.sku.trim() &&
  variant.isActive !== false &&
  typeof variant.product?.documentId === "string" &&
  !!variant.product.documentId.trim();

/**
 * Re-resolves persisted cart lines against the live catalogue.
 *
 * A cart outlives the catalogue rows it points at: re-creating a Product
 * Variant in Strapi mints a new documentId, so every stored line still naming
 * the old one is unsellable and takes the whole quote down with it.
 *
 * SKU is the only stable identity a cart line and a catalogue row share, so it
 * is the only thing remapped on — exactly one active match, or nothing. A line
 * whose SKU cannot decide it falls back to the id it already holds, which is
 * how a legacy line stored before SKUs survives. Names are never matched on,
 * ambiguity is never guessed at, and no price is ever read from the browser:
 * money still comes only from /api/checkout/quote. A line that cannot be
 * resolved is *marked*, never silently dropped.
 */
export const reconcileCartLines = (cart, variants) => {
  const bySku = new Map();
  const byDocumentId = new Map();
  variants.filter(isCatalogueVariant).forEach((variant) => {
    // A duplicate SKU makes the match ambiguous, so it disqualifies the SKU
    // outright rather than picking a winner.
    bySku.set(variant.sku, bySku.has(variant.sku) ? null : variant);
    byDocumentId.set(variant.documentId, variant);
  });

  const reconciled = [];
  cart.forEach((item) => {
    // SKU first: it is the identity that survives a variant being re-created.
    const match =
      (item.sku ? bySku.get(item.sku) : undefined) ||
      byDocumentId.get(item.variantDocumentId);
    const line = match
      ? {
          ...item,
          productDocumentId: match.product.documentId,
          variantDocumentId: match.documentId,
          // Display snapshot refreshed from the catalogue row we just resolved.
          size: match.packSize || match.name || item.size,
          unavailable: false,
        }
      : { ...item, unavailable: true };

    // Two rows that were only distinct because of a stale id are one row again.
    const existing = reconciled.find((entry) => sameLine(entry, line));
    if (existing) {
      existing.qty = Math.min(existing.qty + line.qty, MAX_QUANTITY_PER_LINE);
    } else {
      reconciled.push(line);
    }
  });

  return reconciled;
};

const inFilter = (path, values) =>
  values
    .map((value, index) => `${path}[$in][${index}]=${encodeURIComponent(value)}`)
    .join("&");

// Only the identifiers actually in the cart, so the lookup cannot be truncated
// by catalogue pagination. Anonymous read of the public collection, asking for
// identity and pack size only — no token, and no price is fetched here.
const fetchCartVariants = async (skus, documentIds) => {
  // Indexed from zero over the groups that actually have values: a sparse
  // filters[$or][1] with no [0] is not a list Strapi would read back.
  const orQuery = [
    ["sku", skus],
    ["documentId", documentIds],
  ]
    .filter(([, values]) => values.length)
    .map(([field, values], index) =>
      inFilter(`filters[$or][${index}][${field}]`, values)
    )
    .join("&");

  const res = await fetchDataFromApi(
    "/api/product-variants?" +
      orQuery +
      "&filters[isActive][$eq]=true" +
      "&fields[0]=sku&fields[1]=packSize&fields[2]=name&fields[3]=isActive" +
      "&populate[product][fields][0]=documentId" +
      `&pagination[pageSize]=${skus.length + documentIds.length}`
  );
  return Array.isArray(res?.data) ? res.data : null;
};

export const CartProvider = ({ children }) => {
  // Read synchronously on first render: loading in an effect races the save
  // effect below and wipes the stored cart on mount (twice over, in StrictMode).
  const [cart, setCart] = useState(readStoredCart);
  // Gates pricing until the stored ids have been checked against the catalogue,
  // so a stale cart never spends a quote request it is guaranteed to fail.
  const [cartReady, setCartReady] = useState(cart.length === 0);
  const cartRef = useRef(cart);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    cartRef.current = cart;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  }, [cart]);

  const reconcileCart = useCallback(async () => {
    const lines = cartRef.current;
    const skus = [...new Set(lines.map((item) => item.sku).filter(Boolean))];
    const documentIds = [
      ...new Set(lines.map((item) => item.variantDocumentId).filter(Boolean)),
    ];
    try {
      if (!documentIds.length) return;
      const variants = await fetchCartVariants(skus, documentIds);
      // A catalogue we could not read says nothing about the cart. Marking
      // items unavailable on a network blip would be destructive, so don't.
      if (!variants) return;
      setCart((prevCart) => reconcileCartLines(prevCart, variants));
    } catch {
      // Same policy as an unreadable catalogue: keep the cart as stored. Callers
      // fire this from effects, so a throw here would only be an unhandled
      // rejection that leaves pricing gated forever.
    } finally {
      setCartReady(true);
    }
  }, []);

  // Once on mount: the only moment the catalogue can have moved underneath a
  // persisted cart. Anything added later comes straight from a live listing.
  useEffect(() => {
    if (!cartReady) reconcileCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Stable Strapi document IDs define a line; size/name/price are display only.
  const addToCart = (item) => {
    setCart((prevCart) => {
      if (!isModernCartItem(item)) return prevCart;
      const existingIndex = prevCart.findIndex((p) => sameLine(p, item));

      if (existingIndex >= 0) {
        return prevCart.map((p, i) =>
          i === existingIndex
            ? { ...p, qty: Math.min(p.qty + item.qty, MAX_QUANTITY_PER_LINE) }
            : p
        );
      } else {
        return [...prevCart, item];
      }
    });
  };

  const updateQuantity = (productDocumentId, variantDocumentId, qty) =>
    setCart((prevCart) =>
      Number.isSafeInteger(qty) && qty > 0 && qty <= MAX_QUANTITY_PER_LINE
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

  // Only sellable lines are ever priced, shipped or paid for.
  const availableCart = cart.filter((item) => !item.unavailable);
  const unavailableCart = cart.filter((item) => item.unavailable);
  // One definition of "how many things are in the cart" for every badge and
  // bar: units, not rows, and never inflated by a line that cannot be sold.
  const itemCount = availableCart.reduce((sum, item) => sum + item.qty, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        availableCart,
        unavailableCart,
        itemCount,
        cartReady,
        reconcileCart,
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
