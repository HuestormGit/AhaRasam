import { useState, useContext } from "react";
import axios from "axios";
import { CartContext } from "../../context/CartContext";

const CheckoutPopup = ({ onClose }) => {
  const { cart, clearCart } = useContext(CartContext);
  const [form, setForm] = useState({
    customerName: "",
    email: "",
    phoneNumber: "",
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!cart.length) return setMessage("Cart is empty!");

    try {
      setLoading(true);
      const totalAmount = cart.reduce((sum, i) => sum + i.price * i.qty, 0);

      const res = await axios.post(
        `${process.env.REACT_APP_DEV_URL}/api/orders/razorpay/create`,
        { amount: totalAmount }
      );

      const rzpOrder = res.data.data;

      if (!rzpOrder?.id) {
        setMessage("❌ Invalid Razorpay order ID");
        return;
      }

      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY,
        amount: rzpOrder.amount,
        currency: rzpOrder.currency,
        order_id: rzpOrder.id,
        name: "AHA Rasam",
        description: "Order Payment",
        handler: async function (response) {
          try {
            const verifyRes = await axios.post(
              `${process.env.REACT_APP_DEV_URL}/api/orders/razorpay/verify`,
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                orderData: {
                  customerName: form.customerName,
                  email: form.email,
                  phoneNumber: form.phoneNumber,
                  totalAmount,
                  items: cart.map((i) => ({
                    productName: i.productName,
                    quantity: i.qty,
                    price: i.price,
                    size: i.size || "",
                  })),
                },
              }
            );

            if (verifyRes.data.success) {
              setMessage("✅ Payment successful! Order completed.");
              clearCart();
              onClose();
            } else {
              setMessage("❌ Payment verification failed!");
            }
          } catch (err) {
            console.error("❌ Verification API error:", err);
            setMessage("❌ Verification API error!");
          }
        },
        modal: {
          ondismiss: () => setMessage("Payment cancelled."),
        },
        theme: {
          color: "#F37254",
        },
      };

      if (typeof window.Razorpay === "undefined") {
        setMessage("Razorpay SDK not loaded. Please refresh and try again.");
        return;
      }

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error("❌ Payment process error:", err);
      setMessage("Payment process failed. Try again!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="checkout-popup">
      <h2>Checkout</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="customerName"
          placeholder="Name"
          value={form.customerName}
          onChange={handleChange}
          required
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="phoneNumber"
          placeholder="Phone"
          value={form.phoneNumber}
          onChange={handleChange}
        />
        <button type="submit" disabled={loading}>
          {loading ? "Processing..." : "Place Order"}
        </button>
        <button type="button" onClick={onClose}>
          Cancel
        </button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
};

export default CheckoutPopup;
