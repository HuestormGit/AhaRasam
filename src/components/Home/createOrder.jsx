import axios from "axios";

const createOrder = async (amount) => {
  try {
    // 1. Call Strapi
    const res = await axios.post("http://localhost:1337/api/orders", {
      amount,
      currency: "INR",
    });

    const { razorpayOrder } = res.data;

    // 2. Open Razorpay Checkout
    const options = {
      key: "rzp_test_R5AxLBFpboBciJ", // use test key
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      name: "My Shop",
      description: "Test Transaction",
      order_id: razorpayOrder.id,
      handler: function (response) {
        alert("Payment Successful!");
        console.log(response);
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  } catch (err) {
    console.error("Payment error:", err);
  }
};
