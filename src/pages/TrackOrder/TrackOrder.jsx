import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { AUTH_TOKEN_KEY, customerRequest } from "../../utils/Api";
import { useDocumentMeta } from "../../hooks/usePolicy";
import {
  TRACKING_STAGES,
  fallbackTracking,
  getOrderTracking,
  isDemoAllowed,
  stageIndex,
} from "../../utils/tracking";
import "./TrackOrder.scss";

const BACK_TO_ORDERS = "/account?tab=orders";

const STATUS_COPY = {
  confirmed: {
    heading: "Order Confirmed",
    message: "We have your order and it is queued for packing.",
  },
  preparing: {
    heading: "Preparing Your Order",
    message: "Your order has been received and is currently being prepared.",
  },
  shipped: {
    heading: "Shipped",
    message: "Your order has been handed over to the courier.",
  },
  in_transit: {
    heading: "In Transit",
    message: "Your order is on the way.",
  },
  out_for_delivery: {
    heading: "Out for Delivery",
    message: "Your order is out for delivery today.",
  },
  delivered: {
    heading: "Delivered",
    message: "Your order has been delivered.",
  },
};

const NO_SHIPMENT_NOTE =
  "Tracking information will become available once your order has been handed over to the courier.";

const formatDateTime = (value) => {
  // new Date(null) is the epoch, not an invalid date — an unknown timestamp has
  // to be rejected before it is parsed, or a missing one renders as 1 January.
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? null
    : date.toLocaleString("en-IN", {
        day: "numeric",
        month: "long",
        hour: "numeric",
        minute: "2-digit",
      });
};

const TextRow = ({ label, value }) =>
  value ? (
    <div className="track-order-info-row">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  ) : null;

const PageShell = ({ title, action, children }) => (
  <main className="track-order-page">
    <div className="container">
      <nav className="track-order-nav" aria-label="Order">
        <Link className="track-order-back" to={BACK_TO_ORDERS}>
          ← Back to Orders
        </Link>
        {action}
      </nav>
      <h1>{title}</h1>
      {children}
    </div>
  </main>
);

// Marker and word both carry the state, so the timeline reads the same to a
// screen reader, in high contrast, and on a printout.
const STAGE_STATE = {
  done: { marker: "✓", text: "Completed" },
  current: { marker: "●", text: "In progress" },
  upcoming: { marker: "○", text: "Not yet started" },
};

const Timeline = ({ tracking }) => {
  const current = Math.max(stageIndex(tracking.status), 0);
  const finished = tracking.status === "delivered";
  const timestamps = Object.fromEntries(
    tracking.events.map((event) => [event.status, event.timestamp])
  );

  return (
    <ol className="track-order-timeline">
      {TRACKING_STAGES.map((stage, index) => {
        const state =
          finished || index < current
            ? "done"
            : index === current
            ? "current"
            : "upcoming";
        const when = formatDateTime(timestamps[stage.status]);

        return (
          <li
            key={stage.status}
            className={`track-order-stage is-${state}`}
            aria-current={state === "current" ? "step" : undefined}
          >
            <span className="track-order-marker" aria-hidden="true">
              {STAGE_STATE[state].marker}
            </span>
            <div className="track-order-stage-body">
              <p className="track-order-stage-label">{stage.label}</p>
              <p className="track-order-stage-state">
                {STAGE_STATE[state].text}
                {when ? ` · ${when}` : ""}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
};

const TrackOrder = () => {
  const { orderId } = useParams();
  const [searchParams] = useSearchParams();
  const { logout } = useAuth();
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState({ status: "loading", tracking: null });

  // Only read in development: isDemoAllowed() is the gate inside the adapter
  // too, so a ?demo= typed against the live site changes nothing.
  const demo = isDemoAllowed() ? searchParams.get("demo") : null;

  useDocumentMeta(
    state.tracking?.orderNumber
      ? `Track order ${state.tracking.orderNumber} | AHA! Rasam`
      : "Track Order | AHA! Rasam"
  );

  useEffect(() => {
    let active = true;
    setState({ status: "loading", tracking: null });

    customerRequest(
      "get",
      `/api/orders/${encodeURIComponent(orderId)}`,
      localStorage.getItem(AUTH_TOKEN_KEY)
    )
      .then(async ({ data }) => {
        if (!active) return;
        const order = data?.data;
        if (!order) {
          setState({ status: "missing", tracking: null });
          return;
        }

        // A broken adapter must not cost the customer the page: fall back to
        // what the order row alone can say, which is the safe default anyway.
        let tracking;
        try {
          tracking = await getOrderTracking(order, demo);
        } catch {
          tracking = fallbackTracking(order);
        }
        if (active) setState({ status: "ready", tracking });
      })
      .catch((error) => {
        if (!active) return;
        if ([401, 403].includes(error.response?.status)) {
          logout();
          return;
        }
        setState({
          status: error.response?.status === 404 ? "missing" : "error",
          tracking: null,
        });
      });

    return () => {
      active = false;
    };
  }, [attempt, demo, logout, orderId]);

  if (state.status === "loading") {
    return (
      <PageShell title="Track Your Order">
        <p className="track-order-status" role="status">
          Loading your order…
        </p>
      </PageShell>
    );
  }

  if (state.status === "missing") {
    return (
      <PageShell title="Order not found">
        <p className="track-order-status">
          We couldn&apos;t find this order.
        </p>
      </PageShell>
    );
  }

  if (state.status === "error") {
    return (
      <PageShell title="Track Your Order">
        <p className="track-order-status" role="alert">
          We couldn&apos;t load your order right now. Please try again.
        </p>
        <button
          type="button"
          className="track-order-retry"
          onClick={() => setAttempt((count) => count + 1)}
        >
          Try again
        </button>
      </PageShell>
    );
  }

  const { tracking } = state;
  const copy = STATUS_COPY[tracking.status];
  const lastUpdated = formatDateTime(tracking.lastUpdatedAt);
  // Shipment information, not merely a timestamp: before the order is with a
  // courier there is nothing to put in this card, and an empty one reading
  // "Last updated" would imply tracking that does not exist yet.
  const hasShipment = !!(
    tracking.courier ||
    tracking.awb ||
    tracking.estimatedDelivery
  );
  // The promise of tracking to come only makes sense before the order ships.
  // An order the backend marked delivered without an AWB has no shipment card
  // either, and telling that customer to wait for tracking would be nonsense.
  const preShipment = stageIndex(tracking.status) < stageIndex("shipped");

  return (
    <PageShell
      title="Track Your Order"
      action={
        <Link
          className="track-order-details-link"
          to={`/account/orders/${encodeURIComponent(orderId)}`}
        >
          View order details
        </Link>
      }
    >
      {tracking.orderNumber && (
        <p className="track-order-number">Order #{tracking.orderNumber}</p>
      )}

      {tracking.isDemo && (
        <p className="track-order-demo" role="status">
          Demo tracking state — development only. This is not real shipment
          data.
        </p>
      )}

      <section
        className="track-order-card track-order-current"
        aria-labelledby="track-current-title"
      >
        <h2 id="track-current-title">{copy.heading}</h2>
        <p>{copy.message}</p>
        {!hasShipment && preShipment && (
          <p className="track-order-note">{NO_SHIPMENT_NOTE}</p>
        )}
        {tracking.estimatedDelivery?.label && (
          <p className="track-order-eta">
            <span>Expected delivery</span>
            <strong>{tracking.estimatedDelivery.label}</strong>
          </p>
        )}
      </section>

      {/* One column until there is a second card to put beside the timeline —
          a half-empty two-column grid reads as something that failed to load. */}
      <div className={`track-order-layout${hasShipment ? "" : " is-single"}`}>
        <section
          className="track-order-card"
          aria-labelledby="track-timeline-title"
        >
          <h2 id="track-timeline-title">Order progress</h2>
          <Timeline tracking={tracking} />
        </section>

        {hasShipment && (
          <section
            className="track-order-card"
            aria-labelledby="track-shipment-title"
          >
            <h2 id="track-shipment-title">Shipment details</h2>
            <dl className="track-order-info">
              <TextRow label="Courier" value={tracking.courier} />
              <TextRow label="Tracking ID" value={tracking.awb} />
              <TextRow
                label="Estimated delivery"
                value={tracking.estimatedDelivery?.label}
              />
              <TextRow label="Last updated" value={lastUpdated} />
            </dl>
          </section>
        )}
      </div>
    </PageShell>
  );
};

export default TrackOrder;
