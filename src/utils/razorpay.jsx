// src/utils/razorpay.jsx

export const openRazorpay = (orderId, amount, razorpayOrderId, onSuccess) => {
  const options = {
    key: process.env.REACT_APP_RAZORPAY_KEY,
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
