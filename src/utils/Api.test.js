import {
  apiClient,
  authRequest,
  customerRequest,
  fetchDataFromApi,
  mediaUrl,
} from "./Api";

const CMS_TOKEN = "test-cms-token";
const CUSTOMER_JWT = "test-customer-jwt";
const PRODUCTS = "/api/products?populate=*&sort=id:asc&publicationState=live";

let sent;

beforeEach(() => {
  localStorage.clear();
  process.env.REACT_APP_STRAPI_TOKEN = CMS_TOKEN;
  sent = [];
  apiClient.defaults.adapter = jest.fn((config) => {
    sent.push(config);
    return Promise.resolve({ data: { data: [] }, status: 200, config, headers: {} });
  });
});

const authOf = () => sent.at(-1).headers.Authorization;

test("products use the CMS token while logged out", async () => {
  await fetchDataFromApi(PRODUCTS);
  expect(authOf()).toBe(`Bearer ${CMS_TOKEN}`);
});

test("products still use the CMS token while logged in", async () => {
  localStorage.setItem("ahaRasamAuthToken", CUSTOMER_JWT);
  await fetchDataFromApi(PRODUCTS);
  expect(authOf()).toBe(`Bearer ${CMS_TOKEN}`);
  expect(authOf()).not.toContain(CUSTOMER_JWT);
});

test("a stored customer JWT never leaks onto shared client defaults", () => {
  localStorage.setItem("ahaRasamAuthToken", CUSTOMER_JWT);
  expect(apiClient.defaults.headers.common.Authorization).toBeUndefined();
});

test.each([
  "/api/auth/local",
  "/api/auth/local/register",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
])("%s sends no Authorization header", async (url) => {
  localStorage.setItem("ahaRasamAuthToken", CUSTOMER_JWT);
  await authRequest("post", url, {});
  expect(authOf()).toBeUndefined();
});

test("/api/users/me sends the customer JWT", async () => {
  await customerRequest("get", "/api/users/me", CUSTOMER_JWT);
  expect(authOf()).toBe(`Bearer ${CUSTOMER_JWT}`);
});

test("relative media URLs resolve against the Strapi origin, not /api", () => {
  expect(mediaUrl("/uploads/rasampowder_7f747ac5ee.png")).toBe(
    "http://localhost:1337/uploads/rasampowder_7f747ac5ee.png"
  );
});

test("absolute media URLs pass through unchanged", () => {
  const url = "https://cdn.example.com/uploads/rasampowder.png";
  expect(mediaUrl(url)).toBe(url);
});

test("missing media stays falsy so callers fall back", () => {
  expect(mediaUrl(undefined)).toBeFalsy();
  expect(mediaUrl(null)).toBeFalsy();
  expect(mediaUrl("")).toBeFalsy();
});
