import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { AUTH_TOKEN_KEY, customerRequest } from "../../utils/Api";
import { formatMinor, gstSummaryLabel } from "../../utils/money";
import { useDocumentMeta } from "../../hooks/usePolicy";
import "./OrderDetails.scss";

const BACK_TO_ORDERS = "/account?tab=orders";

const statusLabel = (value) =>
  value ? value.charAt(0).toUpperCase() + value.slice(1) : "Pending";

const formatDateTime = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : date.toLocaleString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
};

const AmountRow = ({ label, value, discount = false }) =>
  Number.isSafeInteger(value) ? (
    <div className="order-details-summary-row">
      <dt>{label}</dt>
      <dd>{discount && value > 0 ? "−" : ""}₹{formatMinor(value)}</dd>
    </div>
  ) : null;

const TextRow = ({ label, value }) =>
  value ? (
    <div className="order-details-info-row">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  ) : null;

const OrderItem = ({ item }) => {
  const variant = [item.variantNameSnapshot, item.packSizeSnapshot]
    .filter(Boolean)
    .join(" · ");

  return (
    <li className="order-details-item">
      <div className="order-details-item-head">
        <div>
          <h3>{item.productTitleSnapshot || "Product"}</h3>
          {variant && <p>{variant}</p>}
          {item.skuSnapshot && <p>SKU: {item.skuSnapshot}</p>}
        </div>
        <strong>₹{formatMinor(item.lineTotalMinor)}</strong>
      </div>
      <dl className="order-details-item-values">
        <TextRow label="Quantity" value={item.quantity} />
        <AmountRow label="Unit price" value={item.unitSellingPriceMinor} />
        {item.lineDiscountMinor > 0 && (
          <AmountRow label="Discount" value={item.lineDiscountMinor} discount />
        )}
        <AmountRow label="Taxable amount" value={item.lineTaxableBaseMinor} />
        <AmountRow
          label={
            Number.isSafeInteger(item.gstRateBps)
              ? `GST @ ${item.gstRateBps / 100}%`
              : "GST"
          }
          value={item.lineGstMinor}
        />
      </dl>
    </li>
  );
};

const PageShell = ({ title, children }) => (
  <main className="order-details-page">
    <div className="container">
      <Link className="order-details-back" to={BACK_TO_ORDERS}>
        ← Back to Orders
      </Link>
      <h1>{title}</h1>
      {children}
    </div>
  </main>
);

const OrderDetails = () => {
  const { orderId } = useParams();
  const { logout } = useAuth();
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState({ status: "loading", order: null });
  useDocumentMeta(
    state.status === "ready" && state.order?.orderNumber
      ? `Order ${state.order.orderNumber} | AHA! Rasam`
      : "Order Details | AHA! Rasam"
  );

  useEffect(() => {
    let active = true;
    setState({ status: "loading", order: null });

    customerRequest(
      "get",
      `/api/orders/${encodeURIComponent(orderId)}`,
      localStorage.getItem(AUTH_TOKEN_KEY)
    )
      .then(({ data }) => {
        if (!active) return;
        setState(
          data?.data
            ? { status: "ready", order: data.data }
            : { status: "missing", order: null }
        );
      })
      .catch((error) => {
        if (!active) return;
        if ([401, 403].includes(error.response?.status)) {
          logout();
          return;
        }
        setState({
          status: error.response?.status === 404 ? "missing" : "error",
          order: null,
        });
      });

    return () => {
      active = false;
    };
  }, [attempt, logout, orderId]);

  if (state.status === "loading") {
    return (
      <PageShell title="Order details">
        <p className="order-details-status" role="status">
          Loading order details…
        </p>
      </PageShell>
    );
  }

  if (state.status === "missing") {
    return (
      <PageShell title="Order not found">
        <p className="order-details-status">
          We couldn&apos;t find this order.
        </p>
      </PageShell>
    );
  }

  if (state.status === "error") {
    return (
      <PageShell title="Order details">
        <p className="order-details-status" role="alert">
          We couldn&apos;t load your order right now. Please try again.
        </p>
        <button
          type="button"
          className="order-details-retry"
          onClick={() => setAttempt((current) => current + 1)}
        >
          Try again
        </button>
      </PageShell>
    );
  }

  const { order } = state;
  const address = order.shippingSnapshot;
  const locality = [address?.city, address?.state, address?.postalCode]
    .filter(Boolean)
    .join(", ");
  const hasTracking =
    order.awbNumber || order.trackingUrl || order.shippedAt || order.deliveredAt;
  const trackingUrl = /^https?:\/\//i.test(order.trackingUrl || "")
    ? order.trackingUrl
    : null;

  return (
    <PageShell title={order.orderNumber ? `Order #${order.orderNumber}` : "Order details"}>
      <header className="order-details-header">
        <div>
          <p>Placed {formatDateTime(order.createdAt)}</p>
          <div className="order-details-badges">
            <span>Payment: {statusLabel(order.paymentStatus)}</span>
            <span>Delivery: {statusLabel(order.shipmentStatus)}</span>
          </div>
        </div>
        <p className="order-details-total">
          <span>Grand total</span>
          <strong>₹{formatMinor(order.grandTotalMinor)}</strong>
        </p>
      </header>

      <div className="order-details-layout">
        <section className="order-details-card" aria-labelledby="order-items-title">
          <h2 id="order-items-title">Order items</h2>
          {order.orderItems?.length > 0 ? (
            <ul className="order-details-items">
              {order.orderItems.map((item) => (
                <OrderItem
                  key={
                    item.documentId ||
                    item.id ||
                    `${item.skuSnapshot}:${item.productTitleSnapshot}:${item.variantNameSnapshot}:${item.packSizeSnapshot}`
                  }
                  item={item}
                />
              ))}
            </ul>
          ) : (
            <p>Item details are unavailable.</p>
          )}
        </section>

        <div className="order-details-side">
          <section className="order-details-card" aria-labelledby="order-summary-title">
            <h2 id="order-summary-title">Order summary</h2>
            <dl className="order-details-summary">
              <AmountRow label="Items MRP" value={order.itemsMrpTotalMinor} />
              <AmountRow label="Discount" value={order.discountMinor} discount />
              <AmountRow label="Taxable amount" value={order.taxableBaseMinor} />
              <AmountRow
                label={gstSummaryLabel(order.orderItems)}
                value={order.taxMinor}
              />
              <AmountRow label="Subtotal" value={order.subtotalMinor} />
              <AmountRow label="Shipping" value={order.shippingFeeMinor} />
              <AmountRow label="Total" value={order.grandTotalMinor} />
            </dl>
          </section>

          {address && (
            <section className="order-details-card" aria-labelledby="delivery-title">
              <h2 id="delivery-title">Delivery details</h2>
              <address className="order-details-address">
                {address.fullName && <strong>{address.fullName}</strong>}
                {[address.addressLine1, address.addressLine2, address.landmark]
                  .filter(Boolean)
                  .map((line, index) => <span key={`${index}-${line}`}>{line}</span>)}
                {locality && <span>{locality}</span>}
                {address.country && <span>{address.country}</span>}
                {address.phone && <span>Phone: {address.phone}</span>}
              </address>
            </section>
          )}

          <section className="order-details-card" aria-labelledby="payment-title">
            <h2 id="payment-title">Payment details</h2>
            <dl className="order-details-info">
              <TextRow label="Status" value={statusLabel(order.paymentStatus)} />
              <TextRow label="Provider" value={statusLabel(order.paymentProvider)} />
              <TextRow label="Order reference" value={order.paymentProviderOrderId} />
              <TextRow label="Payment reference" value={order.paymentProviderPaymentId} />
              <TextRow
                label="Paid on"
                value={order.paidAt ? formatDateTime(order.paidAt) : null}
              />
            </dl>
          </section>

          {hasTracking && (
            <section className="order-details-card" aria-labelledby="shipping-title">
              <h2 id="shipping-title">Shipping details</h2>
              <dl className="order-details-info">
                <TextRow label="Status" value={statusLabel(order.shipmentStatus)} />
                <TextRow
                  label="Shipping service"
                  value={statusLabel(order.shipmentProvider)}
                />
                <TextRow label="AWB" value={order.awbNumber} />
                <TextRow
                  label="Shipped on"
                  value={order.shippedAt ? formatDateTime(order.shippedAt) : null}
                />
                <TextRow
                  label="Delivered on"
                  value={order.deliveredAt ? formatDateTime(order.deliveredAt) : null}
                />
              </dl>
              {trackingUrl && (
                <a href={trackingUrl} target="_blank" rel="noreferrer">
                  Track shipment
                </a>
              )}
            </section>
          )}
        </div>
      </div>
    </PageShell>
  );
};

export default OrderDetails;
