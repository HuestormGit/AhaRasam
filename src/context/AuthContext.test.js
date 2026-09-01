import { act, renderHook, waitFor } from "@testing-library/react";
import { useContext } from "react";
import { AuthProvider, useAuth } from "./AuthContext";
import { CartContext, CartProvider } from "./CartContext";
import { safeReturnTo } from "../components/Auth/AuthPages";
import {
  API_BASE_URL,
  AUTH_TOKEN_KEY,
  authRequest,
  customerRequest,
} from "../utils/Api";

jest.mock(
  "react-router-dom",
  () => ({
    Navigate: () => null,
    useLocation: () => ({ pathname: "/", search: "" }),
  }),
  { virtual: true }
);

jest.mock("../utils/Api", () => ({
  API_BASE_URL: "http://localhost:1337",
  AUTH_TOKEN_KEY: "ahaRasamAuthToken",
  customerRequest: jest.fn(),
  authRequest: jest.fn(),
}));

const wrapper = ({ children }) => (
  <CartProvider>
    <AuthProvider>{children}</AuthProvider>
  </CartProvider>
);

beforeEach(() => {
  localStorage.clear();
  authRequest.mockReset();
  customerRequest.mockReset();
});

test("uses the local Strapi auth contract and keeps the cart through login", async () => {
  authRequest.mockResolvedValue({
    data: { jwt: "customer-jwt", user: { id: 1, email: "customer@example.com" } },
  });
  const { result } = renderHook(
    () => ({ auth: useAuth(), cart: useContext(CartContext) }),
    { wrapper }
  );
  await waitFor(() => expect(result.current.auth.loading).toBe(false));

  act(() =>
    result.current.cart.addToCart({
      productId: 1,
      size: "200g",
      qty: 2,
      price: 150,
    })
  );
  await act(() => result.current.auth.login(" customer@example.com ", "password"));
  await act(() => result.current.auth.register(" customer@example.com ", "password"));
  await act(() => result.current.auth.forgotPassword(" customer@example.com "));
  await act(() => result.current.auth.resetPassword("reset-code", "new-password", "new-password"));

  expect(authRequest.mock.calls).toEqual([
    ["post", "/api/auth/local", { identifier: "customer@example.com", password: "password" }],
    ["post", "/api/auth/local/register", { email: "customer@example.com", password: "password" }],
    ["post", "/api/auth/forgot-password", { email: "customer@example.com" }],
    ["post", "/api/auth/reset-password", { code: "reset-code", password: "new-password", passwordConfirmation: "new-password" }],
  ]);
  expect(localStorage.getItem(AUTH_TOKEN_KEY)).toBe("customer-jwt");
  expect(result.current.cart.cart).toHaveLength(1);
});

test("clears a stale JWT when current-user restoration is unauthorized", async () => {
  localStorage.setItem(AUTH_TOKEN_KEY, "stale-jwt");
  customerRequest.mockRejectedValue({ response: { status: 401 } });
  const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(customerRequest).toHaveBeenCalledWith("get", "/api/users/me", "stale-jwt");
  expect(localStorage.getItem(AUTH_TOKEN_KEY)).toBeNull();
  expect(result.current.user).toBeNull();
});

test("resolves every auth endpoint against local Strapi", () => {
  expect(
    [
      "/api/auth/local/register",
      "/api/auth/local",
      "/api/users/me",
      "/api/auth/forgot-password",
      "/api/auth/reset-password",
    ].map((path) => `${API_BASE_URL}${path}`)
  ).toEqual([
    "http://localhost:1337/api/auth/local/register",
    "http://localhost:1337/api/auth/local",
    "http://localhost:1337/api/users/me",
    "http://localhost:1337/api/auth/forgot-password",
    "http://localhost:1337/api/auth/reset-password",
  ]);
});

test("accepts only same-origin return paths", () => {
  expect(safeReturnTo("/checkout?from=cart")).toBe("/checkout?from=cart");
  expect(safeReturnTo("https://example.com")).toBe("/");
  expect(safeReturnTo("//example.com/checkout")).toBe("/");
  expect(safeReturnTo("/\\example.com/checkout")).toBe("/");
});
