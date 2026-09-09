import React, { useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CartContext } from "../../context/CartContext";
import "./Cart.scss";
import { useCheckoutQuote } from "../../hooks/useCheckoutQuote";
import {
  deliveryErrorMessage,
  formatDeliveryEstimate,
  unserviceableMessage,
  useDeliveryCheck,
} from "../../hooks/useDeliveryCheck";
import { formatMinor, gstSummaryLabel } from "../../utils/money";
import trash from "../../assets/trash.png";

const unavailableMessage =
  "One or more items in your cart are no longer available. Please remove them and add them again.";

const Cart = () => {
  const {
    cart,
    availableCart,
    unavailableCart,
    cartReady,
    reconcileCart,
    updateQuantity,
    removeFromCart,
  } = useContext(CartContext);
  const navigate = useNavigate();
  // Nothing is priced or shipped until the stored ids have been checked against
  // the catalogue, and a line the catalogue cannot sell is never sent at all.
  const pricedCart = cartReady ? availableCart : [];
  const { quote, quoteLoading, quoteError, quoteErrorCode, retryQuote } =
    useCheckoutQuote(pricedCart);
  const delivery = useDeliveryCheck(pricedCart);
  const { selectedOption } = delivery;
  const pricing = !cartReady || quoteLoading;
  const quotedLines = new Map(
    (quote?.items || []).map((item) => [
      `${item.productDocumentId}:${item.variantDocumentId}`,
      item,
    ])
  );

  const handleIncrease = (item) =>
    updateQuantity(item.productDocumentId, item.variantDocumentId, item.qty + 1);

  const handleDecrease = (item) => {
    if (item.qty > 1) {
      updateQuantity(item.productDocumentId, item.variantDocumentId, item.qty - 1);
    } else {
      handleRemove(item);
    }
  };

  const handleRemove = (item) =>
    removeFromCart(item.productDocumentId, item.variantDocumentId);

  // A variant deactivated while this tab was open fails the quote even though
  // the ids were good at load. Re-resolving against the catalogue marks just
  // that line, so the rest of the cart prices instead of the page dead-ending.
  useEffect(() => {
    if (quoteErrorCode === "CART_ITEM_UNAVAILABLE") reconcileCart();
  }, [quoteErrorCode, reconcileCart]);

  return (
    <div className="cart-container container-fluid p-0">
      <div className="navbg"></div>
      <div className="container">
        <section className="cart-section">
          <h2>Cart</h2>

          {cart.length === 0 ? (
            <p className="no-product">Your cart is empty!</p>
          ) : (
            <>
              {pricing && (
                <p className="cart-status" role="status">
                  Calculating price details…
                </p>
              )}
              {/* The line-level notice is the accurate one, so the quote error
                  never doubles up on it. */}
              {unavailableCart.length > 0 && (
                <div className="cart-unavailable" role="alert">
                  <p>{unavailableMessage}</p>
                </div>
              )}
              {!pricing && quoteError && unavailableCart.length === 0 && (
                <div className="quote-error" role="alert">
                  <p>{quoteError}</p>
                  <button type="button" onClick={retryQuote}>Retry</button>
                </div>
              )}

              <div className="cart-table-wrap">
                <table className="table cart-table">
                  <thead className="red-dark">
                    <tr className="tableheadingrow">
                      <th>Product</th>
                      <th>Weight</th>
                      <th>MRP</th>
                      <th>Discount</th>
                      <th>Price</th>
                      <th>Quantity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.map((item) => {
                      const key = `${item.productDocumentId}:${item.variantDocumentId}`;
                      const quotedItem = quotedLines.get(key);
                      return (
                        <tr
                          key={key}
                          className={
                            item.unavailable
                              ? "tabledatarow is-unavailable"
                              : "tabledatarow"
                          }
                        >
                          <td className="product-cell" data-label="Product">
                            <h4>{quotedItem?.productName || item.productName}</h4>
                            {item.unavailable && (
                              <p className="item-unavailable">No longer available</p>
                            )}
                          </td>
                          <td data-label="Weight">
                            {/* Strapi packSize wins once quoted; cached size is fallback only. */}
                            {quotedItem ? quotedItem.size : item.size}
                          </td>
                          <td data-label="MRP">
                            {quotedItem ? `₹${formatMinor(quotedItem.lineMrpPaise)}` : "—"}
                          </td>
                          <td className="discount" data-label="Discount">
                            {quotedItem
                              ? `-₹${formatMinor(quotedItem.lineDiscountPaise)}`
                              : "—"}
                          </td>
                          <td data-label="Price">
                            {quotedItem ? `₹${formatMinor(quotedItem.lineTotalPaise)}` : "—"}
                          </td>
                          <td className="quantity-cell" data-label="Quantity">
                            <div className="quantity-row">
                              <button
                                type="button"
                                className="remove-btn"
                                aria-label={`Remove ${quotedItem?.productName || item.productName}`}
                                onClick={() => handleRemove(item)}
                              >
                                <img src={trash} alt="" className="trash" />
                              </button>
                            {/* Changing the quantity of something that cannot be
                                sold has no meaning — only removing it does. */}
                            {!item.unavailable && (
                            <div className="varqty-sec">
                              <button
                                type="button"
                                className="qty-btn qty-btn-left"
                                aria-label={`Decrease ${quotedItem?.productName || item.productName} quantity`}
                                onClick={() => handleDecrease(item)}
                              >
                                -
                              </button>
                              <span className="qty-value">{item.qty}</span>
                              <button
                                type="button"
                                className="qty-btn qty-btn-right"
                                aria-label={`Increase ${quotedItem?.productName || item.productName} quantity`}
                                onClick={() => handleIncrease(item)}
                              >
                                +
                              </button>
                            </div>
                            )}
                          </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {quote && (
                <section className="order-summary" aria-labelledby="order-summary-title">
                  <h3 id="order-summary-title">Order Summary</h3>
                  <div className="summary-row">
                    <span>MRP Total</span>
                    <span>₹{formatMinor(quote.mrpTotalPaise)}</span>
                  </div>
                  <div className="summary-row discount">
                    <span>Introductory Discount</span>
                    <span>-₹{formatMinor(quote.discountTotalPaise)}</span>
                  </div>
                  <div className="summary-row">
                    <span>Taxable Subtotal</span>
                    <span>₹{formatMinor(quote.taxableSubtotalPaise)}</span>
                  </div>
                  <div className="summary-row">
                    <span>{gstSummaryLabel(quote.items)}</span>
                    <span>₹{formatMinor(quote.gstTotalPaise)}</span>
                  </div>
                  <div className="summary-row cart-subtotal">
                    <strong>Cart Subtotal</strong>
                    <strong>₹{formatMinor(quote.subtotalPaise)}</strong>
                  </div>
                  <div className="delivery-check">
                    <label htmlFor="delivery-pincode">Delivery Pincode</label>
                    <div className="delivery-check-row">
                      <input
                        id="delivery-pincode"
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={6}
                        autoComplete="postal-code"
                        placeholder="411057"
                        value={delivery.pincode}
                        onChange={(event) => delivery.setPincode(event.target.value)}
                      />
                      <button
                        type="button"
                        className="delivery-check-btn"
                        onClick={delivery.check}
                        disabled={delivery.status === "checking"}
                      >
                        {delivery.status === "checking" ? "Checking…" : "Check"}
                      </button>
                    </div>

                    {delivery.pincodeError && (
                      <p className="delivery-invalid" role="alert">
                        {delivery.pincodeError}
                      </p>
                    )}
                    {delivery.status === "checking" && (
                      <p className="delivery-status" role="status">
                        Checking delivery availability…
                      </p>
                    )}
                    {delivery.status === "ready" && (
                      <p className="delivery-available">✓ Delivery available</p>
                    )}
                    {/* Only options the backend actually returned are rendered:
                        no Express placeholder, no "Express unavailable" row. */}
                    {delivery.status === "ready" && delivery.options.length > 0 && (
                      <fieldset className="delivery-options">
                        <legend>Delivery options</legend>
                        {delivery.options.map((option) => (
                          <label
                            key={option.id}
                            className={
                              option.id === selectedOption?.id
                                ? "delivery-option is-selected"
                                : "delivery-option"
                            }
                          >
                            <input
                              type="radio"
                              name="delivery-option"
                              value={option.id}
                              checked={option.id === selectedOption?.id}
                              onChange={() => delivery.selectOption(option.id)}
                            />
                            <span className="delivery-option-text">
                              <span className="delivery-option-label">{option.label}</span>
                              <span className="delivery-option-meta">
                                ₹{formatMinor(option.shippingPaise)} · Estimated{" "}
                                {formatDeliveryEstimate(option)}
                              </span>
                            </span>
                          </label>
                        ))}
                      </fieldset>
                    )}
                    {delivery.status === "unserviceable" && (
                      <p className="delivery-unserviceable" role="alert">
                        {unserviceableMessage}
                      </p>
                    )}
                    {delivery.status === "error" && (
                      <div className="delivery-error" role="alert">
                        <p>{deliveryErrorMessage}</p>
                        <button type="button" onClick={delivery.retry}>
                          Retry
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="summary-row shipping-row">
                    <span>Shipping</span>
                    <span>
                      {selectedOption
                        ? `₹${formatMinor(selectedOption.shippingPaise)}`
                        : "Enter pincode to check"}
                    </span>
                  </div>
                  {selectedOption && (
                    <>
                      <div className="summary-row">
                        <span>Estimated Delivery</span>
                        <span>{formatDeliveryEstimate(selectedOption)}</span>
                      </div>
                      <div className="summary-row cart-total">
                        <strong>Total</strong>
                        {/* Display only, in paise. The server re-quotes at payment. */}
                        <strong>
                          ₹{formatMinor(quote.subtotalPaise + selectedOption.shippingPaise)}
                        </strong>
                      </div>
                    </>
                  )}
                </section>
              )}

              <button
                type="button"
                className="checkout-btn"
                disabled={!quote || !selectedOption || unavailableCart.length > 0}
                onClick={() => navigate("/checkout")}
              >
                Proceed To Checkout
              </button>
            </>
          )}
        </section>
      </div>
    </div>
  );
};

export default Cart;
