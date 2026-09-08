import axios from "axios";

export const API_BASE_URL = (
  process.env.REACT_APP_STRAPI_URL || "http://localhost:1337"
).replace(/\/+$/, "");
export const AUTH_TOKEN_KEY = "ahaRasamAuthToken";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// apiClient sends no Authorization header, ever. Public storefront reads (the
// catalogue, the cart quote, the delivery check) are granted to Strapi's public
// role, so they need no credential — and a React bundle is public, so it can
// never be trusted to hold one. There is deliberately no interceptor and no
// fallback: anything that needs authority asks for it explicitly below.

// Anonymous auth endpoints (login/register/forgot/reset): no Authorization at all.
export const authRequest = (method, url, data) =>
  apiClient.request({ method, url, data });

// Customer-scoped endpoints (/api/users/me, Razorpay create/verify): the
// customer's own JWT, passed in by the caller. No token, no header — never a
// silent fall back to some ambient credential.
export const customerRequest = (method, url, token, data) =>
  apiClient.request({
    method,
    url,
    data,
    headers: { Authorization: `Bearer ${token}` },
  });

// Strapi media URLs are relative when the provider is local; make them absolute
// against the configured Strapi origin (never the React dev server, never /api).
export const mediaUrl = (url) =>
  !url || /^https?:\/\//.test(url) ? url : `${API_BASE_URL}${url}`;

export const fetchDataFromApi = async (url) => {
  try {
    const { data } = await apiClient.get(url);
    console.log("✅ API response:", data);
    return data;
  } catch (error) {
    console.error("❌ API fetch error:", error);
    return null;
  }
};

export const postDataToApi = async (url, payload) => {
  try {
    const { data } = await apiClient.post(url, payload);
    console.log("✅ API post response:", data);
    return data;
  } catch (error) {
    console.error("❌ API post error:", error.response?.data || error.message);
    throw error;
  }
};
