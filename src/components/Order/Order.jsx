import { useState, useContext } from "react";
import axios from "axios";
import { CartContext } from "../../context/CartContext";

const Order = () => {
  const { cart, clearCart } = useContext(CartContext);
  const [form, setForm] = useState({ customerName: "", email: "", phoneNumber: "" });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!cart.length) return setMessage("Cart is empty!");

    const orderData = {
      customerName: form.customerName,
      email: form.email,
      phoneNumber: form.phoneNumber,
      items: cart,
      totalAmount: cart.reduce((sum, i) => sum + i.price * i.qty, 0),
    };

    try {
      setLoading(true);
      const res = await axios.post(
        `${process.env.REACT_APP_DEV_URL}/api/orders`,
        { data: orderData } // ⚠️ Must include data wrapper
      );
      setMessage(`Order created! ID: ${res.data.data.id}`);
      clearCart();
    } catch (err) {
      console.error("Order failed:", err.response || err);
      setMessage("Failed to create order. Check console.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Checkout</h2>
      <form onSubmit={handleSubmit}>
        <input type="text" name="customerName" placeholder="Name" onChange={handleChange} required />
        <input type="email" name="email" placeholder="Email" onChange={handleChange} required />
        <input type="text" name="phoneNumber" placeholder="Phone" onChange={handleChange} />
        <button type="submit">{loading ? "Processing..." : "Place Order"}</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
};

export default Order;
