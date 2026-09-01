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

// Storefront/CMS content always speaks with the CMS API token, logged in or not.
// The customer JWT is never a substitute for it — it has no content permissions.
apiClient.interceptors.request.use((config) => {
  if (config.skipAuth) return config;

  const cmsToken = process.env.REACT_APP_STRAPI_TOKEN;
  if (cmsToken) config.headers.Authorization = `Bearer ${cmsToken}`;
  return config;
});

// Anonymous auth endpoints (login/register/forgot/reset): no Authorization at all.
export const authRequest = (method, url, data) =>
  apiClient.request({ method, url, data, skipAuth: true });

// Customer-scoped endpoints (/api/users/me, ...): the customer JWT, explicitly.
export const customerRequest = (method, url, token, data) =>
  apiClient.request({
    method,
    url,
    data,
    skipAuth: true,
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
