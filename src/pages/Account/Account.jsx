import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { AUTH_TOKEN_KEY, customerRequest } from "../../utils/Api";
import { formatMinor } from "../../utils/money";
import "./Account.scss";

const TABS = [
  { id: "profile", label: "Profile" },
  { id: "addresses", label: "Addresses" },
  { id: "orders", label: "Orders" },
];

// src/api/order/routes/order.js now lists GET /orders alongside the Razorpay
// payment routes, so the collection is readable. The backend scopes the read to
// the signed-in customer from the JWT and ignores the query below entirely —
// the filter is kept only so the request reads like any other Strapi list call.
const ORDERS_ENDPOINT = "/api/orders";

const ordersQuery = (userId) =>
  `${ORDERS_ENDPOINT}?filters[customer][id][$eq]=${userId}` +
  "&populate=orderItems&sort=createdAt:desc";

const ordersErrorMessage =
  "We couldn't load your orders right now. Please try again.";

const formatDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
};

const statusLabel = (value) =>
  value ? value.charAt(0).toUpperCase() + value.slice(1) : "Pending";

// Reads the customer's own orders with the customer JWT, never the CMS token —
// the same split utils/Api.js already draws for /api/users/me.
const useCustomerOrders = (userId) => {
  const [state, setState] = useState(() =>
    ORDERS_ENDPOINT
      ? { status: "loading", orders: [] }
      : { status: "unavailable", orders: [] }
  );

  useEffect(() => {
    if (!ORDERS_ENDPOINT || !userId) return undefined;

    let active = true;
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    setState({ status: "loading", orders: [] });

    customerRequest("get", ordersQuery(userId), token)
      .then(({ data }) => {
        if (!active) return;
        setState({
          status: "ready",
          orders: Array.isArray(data?.data) ? data.data : [],
        });
      })
      .catch(() => active && setState({ status: "error", orders: [] }));

    return () => {
      active = false;
    };
  }, [userId]);

  return state;
};

const DetailRow = ({ label, value }) => (
  <div className="account-detail">
    <span className="account-detail-label">{label}</span>
    <span className={value ? "account-detail-value" : "account-detail-value is-missing"}>
      {value || "Not on file"}
    </span>
  </div>
);

const PanelHead = ({ title, intro }) => (
  <header className="account-panel-head">
    <h2>{title}</h2>
    <p>{intro}</p>
  </header>
);

const EmptyState = ({ title, children }) => (
  <div className="account-empty">
    <p className="account-empty-title">{title}</p>
    <p>{children}</p>
  </div>
);

const ProfilePanel = ({ user }) => (
  <>
    <PanelHead
      title="Profile"
      intro="The details saved against your Aha Rasam account."
    />
    <div className="account-card">
      <DetailRow label="Name" value="" />
      <DetailRow label="Email" value={user.email} />
      <DetailRow label="Phone Number" value="" />
      <DetailRow label="Member Since" value={formatDate(user.createdAt)} />
      <DetailRow
        label="Email Status"
        value={user.confirmed ? "Verified" : "Not verified"}
      />
    </div>
    <p className="account-panel-note">
      An Aha Rasam account is created with an email address alone, so name and
      phone number are not stored on the customer record yet — they are captured
      per order at checkout instead. Editing your profile will be available once
      those fields exist on the backend.
    </p>
  </>
);

// Shaped after the backend's order.shipping-snapshot component, so a saved
// address and an order's delivery address read identically.
const AddressCard = ({ address }) => (
  <li className="account-address">
    <div className="account-address-head">
      <h3>{address.fullName}</h3>
      {address.isDefault && <span className="account-badge">Default</span>}
    </div>
    <p className="account-address-lines">
      {[address.addressLine1, address.addressLine2, address.landmark]
        .filter(Boolean)
        .join(", ")}
    </p>
    <p className="account-address-lines">
      {[address.city, address.state, address.postalCode]
        .filter(Boolean)
        .join(", ")}
    </p>
    {address.phone && <p className="account-address-phone">{address.phone}</p>}
  </li>
);

const AddressesPanel = ({ addresses }) => (
  <>
    <PanelHead
      title="Addresses"
      intro="Delivery addresses saved to your account."
    />
    {addresses.length > 0 ? (
      <ul className="account-address-list">
        {addresses.map((address) => (
          <AddressCard key={address.id} address={address} />
        ))}
      </ul>
    ) : (
      <EmptyState title="No saved addresses">
        You have not saved any addresses yet.
      </EmptyState>
    )}
    <p className="account-panel-note">
      Saved addresses need an Address model on the backend, which does not exist
      yet — every order keeps its own immutable copy of the address you type at
      checkout. This list stays empty until that model is added.
    </p>
  </>
);

const OrderCard = ({ order }) => (
  <li className="account-order">
    <div className="account-order-head">
      <div>
        <h3>{order.orderNumber || `Order #${order.id}`}</h3>
        <p className="account-order-date">Placed {formatDate(order.createdAt)}</p>
      </div>
      <p className="account-order-total">₹{formatMinor(order.grandTotalMinor)}</p>
    </div>
    <div className="account-order-status">
      <span className="account-badge">
        Payment: {statusLabel(order.paymentStatus)}
      </span>
      <span className="account-badge">
        Delivery: {statusLabel(order.shipmentStatus)}
      </span>
    </div>
    {order.orderItems?.length > 0 && (
      <ul className="account-order-items">
        {order.orderItems.map((item) => (
          <li key={item.id}>
            <span>
              {item.productTitleSnapshot}
              {item.packSizeSnapshot ? ` (${item.packSizeSnapshot})` : ""} ×{" "}
              {item.quantity}
            </span>
            <span>₹{formatMinor(item.lineTotalMinor)}</span>
          </li>
        ))}
      </ul>
    )}
  </li>
);

const OrdersPanel = ({ status, orders }) => (
  <>
    <PanelHead title="Orders" intro="Everything you have ordered from us." />

    {status === "loading" && (
      <p className="account-status" role="status">
        Loading your orders…
      </p>
    )}

    {status === "error" && (
      <p className="account-error" role="alert">
        {ordersErrorMessage}
      </p>
    )}

    {status === "unavailable" && (
      <EmptyState title="Order history is not available yet">
        Your orders are recorded when you pay, but the storefront cannot read
        them back until the backend exposes a customer orders endpoint.
      </EmptyState>
    )}

    {status === "ready" &&
      (orders.length > 0 ? (
        <ul className="account-order-list">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </ul>
      ) : (
        <EmptyState title="No orders yet">
          You haven't placed any orders yet.
        </EmptyState>
      ))}
  </>
);

const Account = () => {
  // RequireAuth resolves the session before this renders, so `user` is present.
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("profile");
  const { status: ordersStatus, orders } = useCustomerOrders(user.id);

  // No saved-address API exists yet. The list renders from this one binding, so
  // wiring it up later is a single change.
  const addresses = [];

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="account-container container-fluid p-0">
      <div className="container">
        <section className="account-section">
          <h1>Account</h1>
          <p className="account-signed-in">Signed in as {user.email}</p>

          <div className="account-layout">
            <aside className="account-sidebar">
              <div
                className="account-tabs"
                role="tablist"
                aria-label="Account sections"
              >
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    id={`account-tab-${tab.id}`}
                    aria-selected={activeTab === tab.id}
                    aria-controls={`account-panel-${tab.id}`}
                    className={
                      activeTab === tab.id ? "account-tab is-active" : "account-tab"
                    }
                    onClick={() => setActiveTab(tab.id)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                className="account-logout-btn"
                onClick={handleLogout}
              >
                Logout
              </button>
            </aside>

            <div
              className="account-panel"
              role="tabpanel"
              id={`account-panel-${activeTab}`}
              aria-labelledby={`account-tab-${activeTab}`}
            >
              {activeTab === "profile" && <ProfilePanel user={user} />}
              {activeTab === "addresses" && <AddressesPanel addresses={addresses} />}
              {activeTab === "orders" && (
                <OrdersPanel status={ordersStatus} orders={orders} />
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Account;
