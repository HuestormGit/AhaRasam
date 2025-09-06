import React, { useState } from "react";
import axios from "axios";
import Modal from "../Modal/Modal";
import "./Contact.scss";
import logo from "../../assets/contactsection.png";

function Contact() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    action: "buy",
    message: "",
  });

  const [modal, setModal] = useState({
    show: false,
    success: false,
    title: "",
    message: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const validateForm = () => {
    return form.name.trim() && form.email.trim() && form.message.trim();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      setModal({
        show: true,
        success: false,
        title: "Validation Error",
        message: "Please fill all required fields!",
      });
      return;
    }

    // ✅ Strapi v5 requires flat JSON, not { data: {...} }
    const payload = {
      name: form.name,
      email: form.email,
      phone: form.phone,
      action: form.action,
      message: form.message,
    };

    console.log("Form state before submit:", form);
    console.log("Payload being sent to Strapi:", JSON.stringify(payload, null, 2));

    setLoading(true);

    try {
      const res = await axios.post(
       `${process.env.REACT_APP_STRAPI_URL}/api/contacts`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
             Authorization: `Bearer ${process.env.REACT_APP_STRAPI_TOKEN}`,
            // 🔑 If using API Token, uncomment below:
            // "Authorization": `Bearer YOUR_API_TOKEN`
          },
        }
      );

      console.log("✅ Strapi response:", res.data);

      setModal({
        show: true,
        success: true,
        title: "Message Sent 🎉",
        message: "Thank you! Your enquiry has been saved.",
      });

      // Reset form
      setForm({ name: "", email: "", phone: "", action: "buy", message: "" });
    } catch (error) {
      console.error("❌ Error saving contact:", error.response?.data || error.message);

      setModal({
        show: true,
        success: false,
        title: "Oops!",
        message: "Something went wrong. Please try again later.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="contact-section" id="Contact">
      <div className="container">
        {/* LEFT FORM BOX */}
        <div className="contact-form-box">
          <h2 className="form-title">Enquiry</h2>
          <p className="form-subtitle">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit.
          </p>

          <form className="contact-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Name"
                required
              />
            </div>

            <div className="form-group">
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Email Id"
                required
              />
            </div>

            <div className="form-group">
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="Phone no."
              />
            </div>

            <div className="form-group radio-group">
              <label>Want to</label>
              <label>
                <input
                  type="radio"
                  name="action"
                  value="buy"
                  checked={form.action === "buy"}
                  onChange={handleChange}
                />
                <span> Buy </span>
              </label>
              <label>
                <input
                  type="radio"
                  name="action"
                  value="sell"
                  checked={form.action === "sell"}
                  onChange={handleChange}
                />
                <span> Sell </span>
              </label>
            </div>

            <div className="form-group">
              <textarea
                name="message"
                value={form.message}
                onChange={handleChange}
                placeholder="Write here"
                required
              />
            </div>

            <div className="btn-container">
              <button type="submit" className="btn-submit" disabled={loading}>
                {loading ? "Sending..." : "Submit"}
              </button>
            </div>
          </form>
        </div>

        {/* RIGHT INFO BOX */}
        <div className="contact-info">
          <img src={logo} alt="Aha Rasam" className="company-logo" />
          <h3 className="company-name">Aha! Rasam</h3>
          <p className="company-address">
            Gut No. 65, Property No. 317, Siddheshwar BK, Pali - Bhira Road,
            <br />
            Taluka Sudhagad, District Raigarh, Maharashtra,
            <br />
            India, 410205
          </p>
        </div>
      </div>

      {/* Modal */}
      <Modal
        show={modal.show}
        success={modal.success}
        title={modal.title}
        message={modal.message}
        onClose={() => setModal({ ...modal, show: false })}
      />
    </section>
  );
}

export default Contact;
