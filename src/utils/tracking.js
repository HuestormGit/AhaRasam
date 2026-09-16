// The storefront's own tracking model, deliberately independent of Shiprocket.
// The tracking page renders the six customer-facing stages below and nothing
// else, so when Strapi grows a GET /api/orders/:id/tracking this file is the
// only one that changes: swap the body of getOrderTracking for the request and
// keep returning the same shape.
//
// Nothing here calls a courier, and nothing here invents shipment data for a
// real order. See fallbackTracking.

export const TRACKING_STAGES = [
  { status: "confirmed", label: "Order Confirmed" },
  { status: "preparing", label: "Preparing Your Order" },
  { status: "shipped", label: "Shipped" },
  { status: "in_transit", label: "In Transit" },
  { status: "out_for_delivery", label: "Out for Delivery" },
  { status: "delivered", label: "Delivered" },
];

export const stageIndex = (status) =>
  TRACKING_STAGES.findIndex((stage) => stage.status === status);

// CRA inlines process.env.NODE_ENV at build time, so in a production bundle
// this reads `"production" !== "production"` — the demo branch below is dead
// code before the browser ever sees it. A hand-typed ?demo= cannot revive it.
export const isDemoAllowed = () => process.env.NODE_ENV !== "production";

const SHIPPED_INDEX = stageIndex("shipped");

// One stage's timestamps keyed by status, so the page can label an event
// without knowing where the value came from.
const buildModel = (order, status, times, shipment, isDemo) => {
  const current = Math.max(stageIndex(status), 0);
  const events = TRACKING_STAGES.slice(0, current + 1).map((stage) => ({
    status: stage.status,
    label: stage.label,
    timestamp: times[stage.status] || null,
  }));

  return {
    orderId: order?.documentId || "",
    orderNumber: order?.orderNumber || "",
    status: TRACKING_STAGES[current].status,
    courier: shipment.courier || null,
    awb: shipment.awb || null,
    estimatedDelivery: shipment.estimatedDelivery || null,
    lastUpdatedAt: events[current].timestamp,
    events,
    isDemo: !!isDemo,
  };
};

// What a real order gets today. The backend exposes no tracking feed, so the
// furthest this can honestly claim is what the order row itself records, and
// an order with none of those fields is "preparing" — never a fabricated
// courier, AWB or delivery estimate. shipmentProvider is deliberately not read
// as the courier: it names our shipping integration, not the person driving.
export const fallbackTracking = (order) => {
  const status = order?.deliveredAt
    ? "delivered"
    : order?.shippedAt || order?.awbNumber
    ? "shipped"
    : "preparing";

  return buildModel(
    order,
    status,
    {
      confirmed: order?.paidAt || order?.createdAt || null,
      shipped: order?.shippedAt || null,
      delivered: order?.deliveredAt || null,
    },
    { awb: order?.awbNumber || null },
    false
  );
};

// ---------------------------------------------------------------- dev fixtures
// Obviously fake, and unreachable outside development: every path to them runs
// through isDemoAllowed() first. Kept here rather than in the page so no
// component ever holds invented shipment data.
const DEMO_SHIPMENT = {
  courier: "Delhivery",
  awb: "TEST123456789",
  estimatedDelivery: { label: "19–21 September" },
};

const DEMO_TIMES = {
  confirmed: "2026-09-15T09:10:00.000Z",
  preparing: "2026-09-15T14:30:00.000Z",
  shipped: "2026-09-16T06:45:00.000Z",
  in_transit: "2026-09-17T22:50:00.000Z",
  out_for_delivery: "2026-09-19T02:15:00.000Z",
  delivered: "2026-09-19T08:40:00.000Z",
};

// Async from the start: the real implementation will be a request, and the page
// already awaits this, so connecting the backend needs no change up here.
export const getOrderTracking = async (order, demoStatus) => {
  if (!demoStatus || !isDemoAllowed()) return fallbackTracking(order);

  const index = stageIndex(demoStatus);
  if (index < 0) return fallbackTracking(order);

  return buildModel(
    order,
    demoStatus,
    DEMO_TIMES,
    index >= SHIPPED_INDEX ? DEMO_SHIPMENT : {},
    true
  );
};
