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

export const openRazorpay = (orderId, amount, razorpayOrderId, onSuccess) => {
  const configError = razorpayConfigError();
  if (configError) throw new Error(configError);

  const options = {
    key: RAZORPAY_KEY,
    amount: amount * 100,
    currency: "INR",
    name: "Rasam Store",
    description: `Payment for Order #${orderId}`,
    order_id: razorpayOrderId,
    handler: function (response) {
      console.log("✅ Payment Successful:", response);
      onSuccess(response); // callback to Cart.jsx
    },
    prefill: {
      name: "Customer",
      email: "customer@example.com",
      contact: "9999999999",
    },
    theme: { color: "#F37254" },
  };

  const rzp = new window.Razorpay(options);
  rzp.open();
};
