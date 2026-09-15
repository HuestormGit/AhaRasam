// src/utils/razorpay.jsx

// Publishable key id only. The key SECRET must never reach the browser — it
// lives on the Strapi backend, which signs orders and verifies signatures.
export const RAZORPAY_KEY = process.env.REACT_APP_RAZORPAY_KEY;

export const RAZORPAY_SDK_URL = "https://checkout.razorpay.com/v1/checkout.js";

// Returns null when checkout can run, otherwise a message explaining why not.
// SDK availability is not checked here — the script is fetched on demand by
// loadRazorpay(), so there is nothing to look at until payment is initiated.
export const razorpayConfigError = () => {
  if (!RAZORPAY_KEY) {
    return "Online payment is not configured yet (REACT_APP_RAZORPAY_KEY is missing). Add your Razorpay test key to .env and restart the app.";
  }
  return null;
};

// The one in-flight load, so a double-clicked Pay button shares a single
// script element. Cleared on failure so the next attempt can try again.
let pending = null;

// Fetches Razorpay Checkout on demand. Resolving means window.Razorpay is
// genuinely usable; rejecting means the caller must not construct one.
export const loadRazorpay = () => {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return Promise.reject(new Error("Razorpay needs a browser"));
  }
  if (window.Razorpay) return Promise.resolve(window.Razorpay);
  if (pending) return pending;

  pending = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${RAZORPAY_SDK_URL}"]`);
    const script = existing || document.createElement("script");

    const fail = () => {
      pending = null;
      script.remove();
      reject(new Error("Razorpay SDK failed to load"));
    };
    // A 200 that somehow did not define the global is a failed load too.
    // Either way `pending` is released: from here on window.Razorpay is the
    // authority, so a stale settled promise can never stand in for the SDK.
    const loaded = () => {
      if (!window.Razorpay) return fail();
      pending = null;
      resolve(window.Razorpay);
    };

    script.addEventListener("load", loaded, { once: true });
    script.addEventListener("error", fail, { once: true });

    if (!existing) {
      script.src = RAZORPAY_SDK_URL;
      script.async = true;
      document.body.appendChild(script);
    }
  });

  return pending;
};
