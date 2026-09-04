// src/utils/razorpay.jsx

// Publishable key id only. The key SECRET must never reach the browser — it
// lives on the Strapi backend, which signs orders and verifies signatures.
export const RAZORPAY_KEY = process.env.REACT_APP_RAZORPAY_KEY;

// Returns null when checkout can run, otherwise a message explaining why not.
export const razorpayConfigError = () => {
  if (!RAZORPAY_KEY) {
    return "Online payment is not configured yet (REACT_APP_RAZORPAY_KEY is missing). Add your Razorpay test key to .env and restart the app.";
  }
  if (typeof window === "undefined" || !window.Razorpay) {
    return "Razorpay checkout could not be loaded. Please check your connection and refresh the page.";
  }
  return null;
};
