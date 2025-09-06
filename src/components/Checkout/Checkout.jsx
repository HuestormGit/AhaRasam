import { useState } from "react";
import axios from "axios";

const Checkout = ({ cart }) => {
  // cart = [{ productName, variant, quantity, price }]
  const [form, setForm] = useState({
    CustomerName: "",
    Email: "",
    PhoneNumber: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // ---- Payment + Save to Strapi ----
  const handlePayment = async () => {
    try {
      // 1. Create order in backend (Strapi Razorpay controller)
      const orderRes = await axios.post("http://localhost:1337/api/orders/create-razorpay-order", {
        amount: total * 100, // in paisa
      });

      const { id: razorpayOrderId, amount } = orderRes.data;

      // 2. Open Razorpay Checkout
      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY,
        amount,
        currency: "INR",
        name: "AHA! Rasam",
        description: "Order Payment",
        order_id: razorpayOrderId,
        handler: async function (response) {
          // response has razorpay_payment_id, razorpay_order_id, razorpay_signature

          // 3. Save order in Strapi
          await axios.post("http://localhost:1337/api/orders", {
            data: {
              CustomerName: form.CustomerName,
              Email: form.Email,
              PhoneNumber: form.PhoneNumber,
              ProductName: cart.map((c) => c.productName).join(", "),
              Variant: cart.map((c) => c.variant).join(", "),
              Quantity: cart.map((c) => c.quantity).join(", "),
              Price: total,
              PaymentStatus: "Paid",
              RazorpayOrderID: response.razorpay_order_id,
              TransactionID: response.razorpay_payment_id,
            },
          });

          alert("Payment successful & order saved!");
        },
        prefill: {
          name: form.CustomerName,
          email: form.Email,
          contact: form.PhoneNumber,
        },
        theme: { color: "#3399cc" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error("Payment error:", err);
      alert("Something went wrong during payment!");
    }
  };

  return (
    <div className="checkout">
      <h2>Checkout</h2>

      {/* Customer Info */}
      <input
        type="text"
        name="CustomerName"
        placeholder="Customer Name"
        value={form.CustomerName}
        onChange={handleChange}
      />
      <input
        type="email"
        name="Email"
        placeholder="Email"
        value={form.Email}
        onChange={handleChange}
      />
      <input
        type="text"
        name="PhoneNumber"
        placeholder="Phone Number"
        value={form.PhoneNumber}
        onChange={handleChange}
      />

      {/* Cart Summary */}
      <h3>Order Summary</h3>
      {cart.map((item, idx) => (
        <div key={idx} className="summary-row">
          {item.productName} – {item.variant} × {item.quantity} = ₹
          {item.price * item.quantity}
        </div>
      ))}
      <h3>Total: ₹{total}</h3>

      <button onClick={handlePayment}>Pay with Razorpay</button>
    </div>
  );
};

export default Checkout;
