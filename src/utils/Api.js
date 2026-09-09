import axios from "axios";

const apiClient = axios.create({
  baseURL: process.env.REACT_APP_STRAPI_URL || "http://localhost:1337",
  headers: {
    Authorization: `Bearer ${process.env.REACT_APP_STRAPI_TOKEN}`,
    "Content-Type": "application/json",
  },
});

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
