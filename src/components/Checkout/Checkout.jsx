import React, { useContext, useEffect, useState } from "react";
import "./Checkout.scss";
import Modal from "../Modal/Modal";
import { CartContext } from "../../context/CartContext";
import { useCheckoutQuote } from "../../hooks/useCheckoutQuote";
import { RAZORPAY_KEY, razorpayConfigError } from "../../utils/razorpay";
import { apiClient } from "../../utils/Api";
import { formatMinor, gstSummaryLabel, minorToRupees } from "../../utils/money";

const Checkout = ({ cartData = [], onClose }) => {
  const { clearCart } = useContext(CartContext);
  const [form, setForm] = useState({
    name: "",
    email: "",
    contact: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });
  const [errors, setErrors] = useState({});
  const [isFormValid, setIsFormValid] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null); // { success, title, message, done }
  const { quote, quoteLoading, quoteError } = useCheckoutQuote(cartData);

  const totalAmount = quote ? minorToRupees(quote.totalPaise) : 0;

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: "" }));
  };

  // ✅ Validation Function
  const validate = () => {
    let newErrors = {};

    if (!form.name.trim()) newErrors.name = "Name is required";
    if (!form.email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) newErrors.email = "Enter a valid email";
    if (!form.contact.trim()) newErrors.contact = "Contact number is required";
    else if (!/^[0-9]{10}$/.test(form.contact)) newErrors.contact = "Enter a valid 10-digit number";

    if (!form.address.trim()) newErrors.address = "Address is required";
    if (!form.city.trim()) newErrors.city = "City is required";
    // state & pincode optional; add validation if you need
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 🔄 Check validity whenever form changes
  useEffect(() => {
    setIsFormValid(validate());
    // eslint-disable-next-line
  }, [form]);

  const showError = (title, message) =>
    setResult({ success: false, title, message });

  // Success modal closes into the thank-you page; everything else just closes.
  const closeResult = () => {
    const done = result?.done;
    setResult(null);
    if (done) window.location.href = "/?thankyou=true";
  };

  const handlePayment = async () => {
    if (!validate()) return;

    if (!cartData.length) {
      showError("Cart is empty", "Add a product to your cart before checking out.");
      return;
    }

    if (!quote) {
      showError("Quote unavailable", "Please review your cart and try again.");
      return;
    }

    // Fail clearly instead of opening a broken Razorpay dialog.
    const configError = razorpayConfigError();
    if (configError) {
      showError("Payment unavailable", configError);
      return;
    }

    try {
      setProcessing(true);

      // TODO: the Razorpay endpoint must rebuild this quote server-side before
      // payment; passing the displayed quote total only preserves compatibility.
      const createRes = await apiClient.post("/api/orders/razorpay/create", {
        amount: totalAmount,
      });

      const { id: razorpayOrderId, amount, currency } = createRes.data?.data || {};

      if (!razorpayOrderId) {
        throw new Error("Failed to create razorpay order on server");
      }

      // 2️⃣ Razorpay Checkout options
      // Razorpay's client "amount" should be in paise. If your backend already returns paise, use it.
      // Here we use `amount` returned from backend (assumed correct). If backend returned rupees,
      // you could send amount * 100 here.
      const options = {
        key: RAZORPAY_KEY,
        amount: amount, // use backend returned amount (preferable)
        currency: currency || "INR",
        name: "AHA! Rasam",
        description: "Order Payment",
        order_id: razorpayOrderId,
        handler: async function (response) {
          try {
            // 3️⃣ Verify payment and save order in Strapi
            const verifyRes = await apiClient.post(
              "/api/orders/razorpay/verify",
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                orderData: {
                  customerName: form.name,
                  email: form.email,
                  phoneNumber: form.contact,
                  address: form.address,
                  city: form.city,
                  state: form.state,
                  pincode: form.pincode,
                  totalAmount,
                  items: cartData,
                },
              }
            );

            if (verifyRes.data?.success === false) {
              showError(
                "Payment verification failed",
                `Payment ${response.razorpay_payment_id} could not be verified. Please contact us before paying again.`
              );
              return;
            }

            clearCart();
            setResult({
              success: true,
              done: true,
              title: "Payment successful",
              message: `Your order is confirmed. Payment ID: ${response.razorpay_payment_id}`,
            });
          } catch (verifyErr) {
            console.error("Verify/save failed:", verifyErr.response || verifyErr);
            showError(
              "Order could not be saved",
              `Your payment went through (ID: ${response.razorpay_payment_id}) but we could not save the order. Please contact us with this payment ID.`
            );
          }
        },
        modal: {
          ondismiss: () => setProcessing(false),
        },
        prefill: {
          name: form.name,
          email: form.email,
          contact: form.contact,
        },
        theme: { color: "#3399cc" },
      };

      const rzp = new window.Razorpay(options);

      // 4️⃣ Payment failure (card declined, timeout, bank error…)
      rzp.on("payment.failed", (response) => {
        console.error("❌ Payment failed:", response.error);
        setProcessing(false);
        showError(
          "Payment failed",
          response.error?.description || "Your payment was not completed. No amount has been charged."
        );
      });

      rzp.open();
    } catch (err) {
      console.error("❌ Payment error:", err.response || err);
      showError(
        "Could not start payment",
        err.response?.data?.error?.message ||
          "Something went wrong while creating your payment. Please try again."
      );
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="popup-overlay">
      <div className="popup-content">
        <h2>Checkout</h2>

        {!cartData.length && <p>Your cart is empty.</p>}
        {quoteLoading && <p role="status">Calculating your total…</p>}
        {quoteError && (
          <div role="alert">
            <p>{quoteError}</p>
            <button type="button" onClick={onClose}>Review cart</button>
          </div>
        )}
        {quote && (
          <>
            <ul>
              {quote.items.map((item) => (
                <li key={`${item.productDocumentId}:${item.variantDocumentId}`}>
                  {item.productName} ({item.size}) - ₹{formatMinor(item.unitSellingPricePaise)} × {item.quantity} = ₹{formatMinor(item.lineTotalPaise)}
                </li>
              ))}
            </ul>
            <section className="checkout-summary" aria-label="Price summary">
              <p><span>MRP Total</span><span>₹{formatMinor(quote.mrpTotalPaise)}</span></p>
              <p className="discount"><span>Introductory Discount</span><span>-₹{formatMinor(quote.discountTotalPaise)}</span></p>
              <p><span>Taxable Subtotal</span><span>₹{formatMinor(quote.taxableSubtotalPaise)}</span></p>
              <p><span>{gstSummaryLabel(quote.items)}</span><span>₹{formatMinor(quote.gstTotalPaise)}</span></p>
              <p className="checkout-subtotal"><strong>Cart Subtotal</strong><strong>₹{formatMinor(quote.subtotalPaise)}</strong></p>
              <p><span>Shipping</span><span>Calculated at checkout</span></p>
              <p className="checkout-total"><strong>Total</strong><strong>₹{formatMinor(quote.totalPaise)}</strong></p>
            </section>
          </>
        )}

        <input type="text" name="name" placeholder="Enter Name" value={form.name} onChange={handleChange} />
        {errors.name && <p className="error">{errors.name}</p>}

        <input type="email" name="email" placeholder="Enter Email" value={form.email} onChange={handleChange} />
        {errors.email && <p className="error">{errors.email}</p>}

        <input type="text" name="contact" placeholder="Enter Contact" value={form.contact} onChange={handleChange} />
        {errors.contact && <p className="error">{errors.contact}</p>}

        <input type="text" name="address" placeholder="Address (Street / House No.)" value={form.address} onChange={handleChange} />
        {errors.address && <p className="error">{errors.address}</p>}

        <input type="text" name="city" placeholder="City" value={form.city} onChange={handleChange} />
        {errors.city && <p className="error">{errors.city}</p>}

        <input type="text" name="state" placeholder="State" value={form.state} onChange={handleChange} />
        <input type="text" name="pincode" placeholder="Pincode" value={form.pincode} onChange={handleChange} />

        <button
          onClick={handlePayment}
          disabled={!isFormValid || processing || quoteLoading || !quote}
        >
          {processing
            ? "Creating Payment..."
            : quote
              ? `Pay ₹${formatMinor(quote.totalPaise)}`
              : "Quote unavailable"}
        </button>
        <button onClick={onClose} disabled={processing}>
          Cancel
        </button>
      </div>

      <Modal
        show={!!result}
        success={result?.success}
        title={result?.title}
        message={result?.message}
        onClose={closeResult}
      />
    </div>
  );
};

export default Checkout;
