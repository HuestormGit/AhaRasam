import React, { useContext, useEffect, useState } from "react";
import "./Checkout.scss";
import Modal from "../Modal/Modal";
import { CartContext } from "../../context/CartContext";
import { useCheckoutQuote } from "../../hooks/useCheckoutQuote";
import {
  PINCODE_PATTERN,
  clearStoredDelivery,
  formatDeliveryEstimate,
  readStoredDelivery,
} from "../../hooks/useDeliveryCheck";
import { RAZORPAY_KEY, razorpayConfigError } from "../../utils/razorpay";
import { AUTH_TOKEN_KEY, customerRequest } from "../../utils/Api";
import { formatMinor, gstSummaryLabel } from "../../utils/money";

const LOGIN_REDIRECT = "/login?redirect=%2Fcheckout";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const PRICE_CHANGED_MESSAGE =
  "Your order total changed while you were checking out. Please review the latest price and delivery rate before paying.";

// After a payment has left the browser we can never promise nothing was
// charged, so every post-payment failure says the same thing: do not pay again.
const doNotRepay = (paymentId) =>
  paymentId
    ? `If money was deducted, please do not pay again. Contact us with payment ID ${paymentId}.`
    : "If money was deducted, please do not pay again. Contact us before trying again.";

// The backend's controlled error envelope: { error: { status, name, message, details } }.
const backendError = (error) => {
  const payload = error?.response?.data?.error || {};
  return {
    status: error?.response?.status,
    name: payload.name,
    code: payload.details?.code,
    message: typeof payload.message === "string" ? payload.message : "",
  };
};

// The server response is the only authority on what will be charged, so it is
// shape-checked before a single field of it reaches Razorpay.
const isValidCreateResponse = (data) =>
  !!data &&
  typeof data.razorpayOrderId === "string" &&
  data.razorpayOrderId.trim() !== "" &&
  Number.isSafeInteger(data.amountPaise) &&
  data.amountPaise >= 100 &&
  data.currency === "INR" &&
  typeof data.orderNumber === "string" &&
  data.orderNumber.trim() !== "";

// Defensive only: the backend has already verified the payment against the
// provider. This just refuses to celebrate a response that does not say "paid".
const isConfirmedPayment = (data, expectedAmountPaise) =>
  !!data &&
  data.paymentStatus === "paid" &&
  data.currency === "INR" &&
  Number.isSafeInteger(data.grandTotalMinor) &&
  data.grandTotalMinor === expectedAmountPaise &&
  typeof data.orderNumber === "string" &&
  data.orderNumber.trim() !== "";

const readAuthToken = () => {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY) || "";
  } catch {
    return "";
  }
};

const Checkout = ({ cartData = [], onClose }) => {
  const { clearCart } = useContext(CartContext);
  // Chosen on the cart page and carried across the navigation. Display and
  // selection state only — the server re-rates the shipment at payment.
  const [delivery, setDelivery] = useState(readStoredDelivery);
  const [form, setForm] = useState({
    name: "",
    email: "",
    contact: "",
    address: "",
    city: "",
    state: "",
  });
  const [errors, setErrors] = useState({});
  const [isFormValid, setIsFormValid] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null); // { success, title, message, done }
  const { quote, quoteLoading, quoteError } = useCheckoutQuote(cartData);

  const shippingPaise = delivery?.option.shippingPaise || 0;
  // Displayed total. Compared against the server's fresh amount before paying,
  // never sent to the server and never used to charge.
  const orderTotalPaise = quote ? quote.subtotalPaise + shippingPaise : 0;

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: "" }));
  };

  // Mirrors what the backend requires: fullName, phone, email, addressLine1,
  // city, state and a 6-digit postalCode.
  const validate = () => {
    const newErrors = {};

    if (!form.name.trim()) newErrors.name = "Name is required";
    if (!form.email.trim()) newErrors.email = "Email is required";
    else if (!EMAIL_PATTERN.test(form.email.trim()))
      newErrors.email = "Enter a valid email";
    if (!form.contact.trim()) newErrors.contact = "Contact number is required";
    else if (!/^[0-9]{10}$/.test(form.contact.trim()))
      newErrors.contact = "Enter a valid 10-digit number";
    if (!form.address.trim()) newErrors.address = "Address is required";
    if (!form.city.trim()) newErrors.city = "City is required";
    if (!form.state.trim()) newErrors.state = "State is required";

    setErrors(newErrors);
    // The pincode is read-only and comes from the delivery check, so it cannot
    // be typed around. Its absence is already explained by the delivery panel,
    // which is why it gates validity without adding a second error message.
    return (
      Object.keys(newErrors).length === 0 &&
      PINCODE_PATTERN.test(delivery?.destinationPincode || "")
    );
  };

  useEffect(() => {
    setIsFormValid(validate());
    // eslint-disable-next-line
  }, [form, delivery]);

  const showError = (title, message) =>
    setResult({ success: false, title, message });

  // Success modal closes into the thank-you page; everything else just closes.
  const closeResult = () => {
    const done = result?.done;
    setResult(null);
    if (done) window.location.href = "/?thankyou=true";
  };

  // A stored rate that the server has rejected must not survive on screen.
  const dropDelivery = () => {
    clearStoredDelivery();
    setDelivery(null);
  };

  // Same navigation mechanism this component already uses for the thank-you
  // redirect. react-router-dom 7 is ESM-only with a broken CJS "main", so it
  // does not resolve under CRA's Jest — and there is no client state worth
  // preserving across a bounce to login anyway.
  const goToLogin = () => {
    window.location.href = LOGIN_REDIRECT;
  };

  // Sends the customer back to the cart to run the delivery check again. The
  // cart page owns serviceability; checkout never re-rates on its own.
  const changePincode = () => {
    dropDelivery();
    if (onClose) onClose();
  };

  const handleCreateError = (error) => {
    const { status, name, code, message } = backendError(error);

    if (status === 401 || name === "UnauthorizedError") {
      goToLogin();
      return;
    }
    // Signed in but the role lacks the payment permission — a server
    // misconfiguration, never the customer's fault and never a payment.
    // Bouncing to login would be a pointless loop, so say so plainly.
    if (status === 403 || name === "ForbiddenError") {
      showError(
        "Checkout temporarily unavailable",
        "Checkout is temporarily unavailable. Your cart has been kept — please try again later."
      );
      return;
    }
    if (code === "SHIPPING_OPTION_UNAVAILABLE" || name === "ShippingOptionUnavailable") {
      dropDelivery();
      showError(
        "Delivery rates changed",
        "Delivery rates have changed. Please re-check delivery for your pincode."
      );
      return;
    }
    if (code === "DELIVERY_UNSERVICEABLE" || name === "DeliveryUnserviceable") {
      dropDelivery();
      showError(
        "Delivery unavailable",
        "Delivery is no longer available to this pincode. Please review your delivery details."
      );
      return;
    }
    // A provider outage is temporary and says nothing about the stored choice,
    // so the delivery selection is deliberately kept.
    if (status === 503 || name === "ShippingProviderError") {
      showError(
        "Delivery check unavailable",
        "We couldn't confirm delivery for your order right now. Your cart has been kept — please try again in a few minutes."
      );
      return;
    }
    if (status === 502 || name === "PaymentProviderError") {
      showError(
        "Payment service unavailable",
        "Payments are temporarily unavailable. Your cart has been kept — please try again shortly."
      );
      return;
    }
    if (status === 400) {
      showError(
        "Please check your details",
        message ||
          "Some of your checkout details could not be accepted. Please review them and try again."
      );
      return;
    }
    showError(
      "Could not start payment",
      "Something went wrong while starting your payment. Please try again."
    );
  };

  const handleVerifyError = (error, paymentId) => {
    const { status, name, code } = backendError(error);

    // Another request already owns this payment's confirmation. Transient, and
    // checked before the general 409 because both share the status.
    if (
      code === "PAYMENT_VERIFICATION_IN_PROGRESS" ||
      name === "PaymentVerificationInProgress"
    ) {
      showError(
        "Payment confirmation in progress",
        `Payment confirmation is still processing. Please do not pay again. ${doNotRepay(paymentId)}`
      );
      return;
    }
    if (status === 400 || name === "PaymentVerificationFailed") {
      showError(
        "Payment verification failed",
        `We could not verify this payment. ${doNotRepay(paymentId)}`
      );
      return;
    }
    if (status === 404 || name === "OrderNotFound") {
      showError(
        "Order could not be matched",
        `We could not match this payment to your order. ${doNotRepay(paymentId)}`
      );
      return;
    }
    if (status === 409 || name === "PaymentAlreadyRecorded") {
      showError(
        "Payment needs review",
        `This order already has a recorded payment. ${doNotRepay(paymentId)}`
      );
      return;
    }
    // 502 and everything else, including an expired session: never redirect
    // here — that would lose the payment id the customer needs for support.
    showError(
      "Payment confirmation unavailable",
      `We couldn't confirm your payment just now. ${doNotRepay(paymentId)}`
    );
  };

  const openCheckout = (created, token) => {
    const options = {
      key: RAZORPAY_KEY,
      // Straight from the server. No conversion, no recomputation.
      amount: created.amountPaise,
      currency: created.currency,
      name: "AHA! Rasam",
      description: `Order ${created.orderNumber}`,
      order_id: created.razorpayOrderId,
      handler: async (response) => {
        const paymentId = response?.razorpay_payment_id;
        try {
          const verifyRes = await customerRequest(
            "post",
            "/api/orders/razorpay/verify",
            token,
            {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }
          );

          const confirmed = verifyRes?.data?.data;
          if (!isConfirmedPayment(confirmed, created.amountPaise)) {
            setProcessing(false);
            showError(
              "Payment not confirmed",
              `We couldn't confirm your payment. ${doNotRepay(paymentId)}`
            );
            return;
          }

          // Only now, with the backend reporting a paid order.
          clearCart();
          dropDelivery();
          setProcessing(false);
          setResult({
            success: true,
            done: true,
            title: "Payment successful",
            message: `Your order ${confirmed.orderNumber} has been confirmed. Payment ID: ${paymentId}`,
          });
        } catch (verifyErr) {
          setProcessing(false);
          handleVerifyError(verifyErr, paymentId);
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

    rzp.on("payment.failed", (response) => {
      setProcessing(false);
      showError(
        "Payment failed",
        response?.error?.description ||
          "Your payment was not completed. Please review the payment message and try again."
      );
    });

    rzp.open();
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

    if (!delivery) {
      showError(
        "Delivery not checked",
        "Please check delivery for your pincode in the cart before paying."
      );
      return;
    }

    // Fail clearly instead of opening a broken Razorpay dialog.
    const configError = razorpayConfigError();
    if (configError) {
      showError("Payment unavailable", configError);
      return;
    }

    // The payment endpoints speak the customer JWT only. The CMS token is never
    // an acceptable fallback here.
    const token = readAuthToken();
    if (!token) {
      goToLogin();
      return;
    }

    setProcessing(true);

    let created;
    try {
      // Stable identifiers, the delivery destination and the chosen option id.
      // No price, no total, no shipping amount — the server rebuilds all of it.
      const createRes = await customerRequest(
        "post",
        "/api/orders/razorpay/create",
        token,
        {
          items: cartData.map((item) => ({
            productDocumentId: item.productDocumentId,
            variantDocumentId: item.variantDocumentId,
            quantity: item.qty,
          })),
          destinationPincode: delivery.destinationPincode,
          selectedShippingOptionId: delivery.option.id,
          shippingAddress: {
            fullName: form.name.trim(),
            phone: form.contact.trim(),
            email: form.email.trim(),
            addressLine1: form.address.trim(),
            addressLine2: "",
            landmark: "",
            city: form.city.trim(),
            state: form.state.trim(),
            // Bound to the pincode whose delivery option was selected, so the
            // quoted address and the shipped address can never diverge.
            postalCode: delivery.destinationPincode,
          },
        }
      );
      created = createRes?.data?.data;
    } catch (err) {
      setProcessing(false);
      handleCreateError(err);
      return;
    }

    if (!isValidCreateResponse(created)) {
      setProcessing(false);
      showError(
        "Could not start payment",
        "We couldn't start your payment. Please try again in a moment."
      );
      return;
    }

    // A catalogue price or delivery rate moved between the page and the fresh
    // server quote. The customer reviews the new total instead of being shown
    // a surprise amount in the Razorpay dialog.
    if (created.amountPaise !== orderTotalPaise) {
      setProcessing(false);
      dropDelivery();
      showError("Order total changed", PRICE_CHANGED_MESSAGE);
      return;
    }

    openCheckout(created, token);
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
              <p><span>Shipping</span><span>{delivery ? `₹${formatMinor(shippingPaise)}` : "Check delivery in your cart"}</span></p>
              <p className="checkout-total"><strong>Total</strong><strong>₹{formatMinor(orderTotalPaise)}</strong></p>
            </section>
            <section className="checkout-delivery" aria-label="Delivery">
              {delivery ? (
                <>
                  <p className="delivery-to">Delivery to {delivery.destinationPincode}</p>
                  <p>
                    <span>{delivery.option.label}</span>
                    <span>₹{formatMinor(delivery.option.shippingPaise)}</span>
                  </p>
                  <p>Estimated {formatDeliveryEstimate(delivery.option)}</p>
                </>
              ) : (
                <>
                  <p>We don't have a delivery pincode for this order yet.</p>
                  <button type="button" onClick={onClose}>
                    Check delivery in cart
                  </button>
                </>
              )}
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
        {errors.state && <p className="error">{errors.state}</p>}

        {/* Read-only on purpose: the selected delivery option belongs to this
            pincode, so editing it here would quote one address and ship another. */}
        <label className="checkout-pincode" htmlFor="checkout-pincode">
          Delivery Pincode
        </label>
        <input
          id="checkout-pincode"
          type="text"
          name="pincode"
          placeholder="Checked in your cart"
          value={delivery?.destinationPincode || ""}
          readOnly
        />
        <button type="button" className="change-pincode-btn" onClick={changePincode}>
          Change delivery pincode
        </button>

        <button
          onClick={handlePayment}
          disabled={!isFormValid || processing || quoteLoading || !quote || !delivery}
        >
          {processing
            ? "Creating Payment..."
            : quote
              ? `Pay ₹${formatMinor(orderTotalPaise)}`
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
