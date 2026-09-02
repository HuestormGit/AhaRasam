import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { CartContext } from "../../context/CartContext";
import "./Cart.scss";
import { useCheckoutQuote } from "../../hooks/useCheckoutQuote";
import { formatMinor, gstSummaryLabel } from "../../utils/money";
import trash from "../../assets/trash.png";

const Cart = () => {
  const { cart, updateQuantity, removeFromCart } = useContext(CartContext);
  const navigate = useNavigate();
  const { quote, quoteLoading, quoteError, retryQuote } = useCheckoutQuote(cart);
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
              {quoteLoading && (
                <p className="cart-status" role="status">
                  Calculating price details…
                </p>
              )}
              {quoteError && (
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
                      <th>MRP (line)</th>
                      <th>Discount (line)</th>
                      <th>Price (line total)</th>
                      <th>Quantity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.map((item) => {
                      const key = `${item.productDocumentId}:${item.variantDocumentId}`;
                      const quotedItem = quotedLines.get(key);
                      return (
                        <tr key={key} className="tabledatarow">
                          <td className="product-cell" data-label="Product">
                            <h4>{quotedItem?.productName || item.productName}</h4>
                            <p>{quotedItem?.size || item.size}</p>
                          </td>
                          <td data-label="MRP (line)">
                            {quotedItem ? `₹${formatMinor(quotedItem.lineMrpPaise)}` : "—"}
                          </td>
                          <td className="discount" data-label="Discount (line)">
                            {quotedItem
                              ? `-₹${formatMinor(quotedItem.lineDiscountPaise)}`
                              : "—"}
                          </td>
                          <td data-label="Price (line total)">
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
                  <div className="summary-row shipping-row">
                    <span>Shipping</span>
                    <span>Calculated at checkout</span>
                  </div>
                </section>
              )}

              <button
                type="button"
                className="checkout-btn"
                disabled={!quote}
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
