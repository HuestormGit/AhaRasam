import { useState, useContext } from "react";
import axios from "axios";
import { CartContext } from "../../context/CartContext";

const Order = () => {
  const { cart, clearCart } = useContext(CartContext);

  const [form, setForm] = useState({
    customerName: "",
    email: "",
    phoneNumber: "",
    address: "",
    city: "",
    state: "",
    pincode: ""
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    if (!form.customerName.trim()) return "Name is required";
    if (!form.email.trim()) return "Email is required";
    if (!cart.length) return "Cart is empty!";
    if (!form.address.trim()) return "Address is required";
    if (!form.city.trim()) return "City is required";
    // pincode optional — add validation if you want
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    const validationError = validate();
    if (validationError) return setMessage(validationError);

    const totalAmount = cart.reduce((sum, i) => sum + i.price * i.qty, 0);

    // If your Strapi schema uses flat fields (address, city, state, pincode),
    // send orderData as below:
    const orderData = {
      customerName: form.customerName,
      email: form.email,
      phoneNumber: form.phoneNumber,
      address: form.address,
      city: form.city,
      state: form.state,
      pincode: form.pincode,
      items: cart,
      totalAmount
    };

    /* 
    // If you switch to a reusable Address component (shared.address) in Strapi,
    // send the address as an object like this instead:
    const orderData = {
      customerName: form.customerName,
      email: form.email,
      phoneNumber: form.phoneNumber,
      // address component shape
      address: {
        addressLine1: form.address,
        addressLine2: "", // optional
        city: form.city,
        state: form.state,
        country: "India",
        pincode: form.pincode
      },
      items: cart,
      totalAmount
    };
    */

    try {
      setLoading(true);
      const res = await axios.post(
        `${process.env.REACT_APP_DEV_URL}/api/orders`,
        { data: orderData } // Strapi requires the { data: {...} } wrapper
      );

      const id = res?.data?.data?.id;
      setMessage(id ? `Order created! ID: ${id}` : "Order created!");
      clearCart();
      // Reset form (keep email/phone if you want)
      setForm({
        customerName: "",
        email: "",
        phoneNumber: "",
        address: "",
        city: "",
        state: "",
        pincode: ""
      });
    } catch (err) {
      console.error("Order failed:", err.response || err);
      // show helpful message if available from Strapi
      const serverMsg = err?.response?.data?.error?.message || err?.response?.data?.message;
      setMessage(serverMsg || "Failed to create order. Check console.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
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

        <input
          type="text"
          name="address"
          placeholder="Address (Street / House No.)"
          value={form.address}
          onChange={handleChange}
          required
        />

        <input
          type="text"
          name="city"
          placeholder="City"
          value={form.city}
          onChange={handleChange}
          required
        />

        <input
          type="text"
          name="state"
          placeholder="State"
          value={form.state}
          onChange={handleChange}
        />

        <input
          type="text"
          name="pincode"
          placeholder="Pincode"
          value={form.pincode}
          onChange={handleChange}
        />

        <button type="submit" disabled={loading}>
          {loading ? "Processing..." : "Place Order"}
        </button>
      </form>

      {message && <p>{message}</p>}
    </div>
  );
};

export default Order;
