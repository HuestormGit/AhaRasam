import { renderHook, act } from "@testing-library/react";
import { useContext } from "react";
import { CartContext, CartProvider } from "./CartContext";

const renderCart = () =>
  renderHook(() => useContext(CartContext), { wrapper: CartProvider });

const item = (over = {}) => ({
  productId: 1,
  productName: "AHA! Rasam Classic",
  size: "200g",
  price: 150,
  qty: 1,
  ...over,
});

beforeEach(() => localStorage.clear());

test("adds to cart and merges quantity for the same product + size", () => {
  const { result } = renderCart();

  act(() => result.current.addToCart(item()));
  act(() => result.current.addToCart(item({ qty: 2 })));

  expect(result.current.cart).toHaveLength(1);
  expect(result.current.cart[0].qty).toBe(3);
});

test("keeps different sizes of the same product as separate lines", () => {
  const { result } = renderCart();

  act(() => result.current.addToCart(item()));
  act(() => result.current.addToCart(item({ size: "500g", price: 320 })));

  expect(result.current.cart).toHaveLength(2);
});

test("persists the cart across a remount", () => {
  const view = renderCart();
  act(() => view.result.current.addToCart(item({ qty: 4 })));
  view.unmount();

  const { result } = renderCart();
  expect(result.current.cart).toEqual([item({ qty: 4 })]);
});

test("removeFromCart and clearCart empty the cart and storage", () => {
  const { result } = renderCart();

  act(() => result.current.addToCart(item()));
  act(() => result.current.addToCart(item({ size: "500g" })));
  act(() => result.current.removeFromCart(0));
  expect(result.current.cart).toHaveLength(1);

  act(() => result.current.clearCart());
  expect(result.current.cart).toEqual([]);
  expect(JSON.parse(localStorage.getItem("cartList"))).toEqual([]);
});

test("survives corrupted cart storage", () => {
  localStorage.setItem("cartList", "not json");
  const { result } = renderCart();
  expect(result.current.cart).toEqual([]);
});

// The key is read at module load, so re-import it under a controlled env
// rather than depending on whatever .env happens to define.
const configErrorWithKey = (key) => {
  const previous = process.env.REACT_APP_RAZORPAY_KEY;
  if (key === undefined) delete process.env.REACT_APP_RAZORPAY_KEY;
  else process.env.REACT_APP_RAZORPAY_KEY = key;

  let error;
  jest.isolateModules(() => {
    error = require("../utils/razorpay").razorpayConfigError();
  });

  if (previous === undefined) delete process.env.REACT_APP_RAZORPAY_KEY;
  else process.env.REACT_APP_RAZORPAY_KEY = previous;
  return error;
};

describe("razorpayConfigError", () => {
  beforeEach(() => {
    window.Razorpay = function () {};
  });
  afterEach(() => {
    delete window.Razorpay;
  });

  test("explains a missing key instead of opening checkout", () => {
    expect(configErrorWithKey(undefined)).toMatch(/REACT_APP_RAZORPAY_KEY/);
  });

  test("passes once a key is configured", () => {
    expect(configErrorWithKey("rzp_test_example")).toBeNull();
  });

  test("reports an unavailable Razorpay SDK", () => {
    delete window.Razorpay;
    expect(configErrorWithKey("rzp_test_example")).toMatch(/could not be loaded/i);
  });
});
