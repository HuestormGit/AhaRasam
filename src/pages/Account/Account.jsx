import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Modal from "../../components/Modal/Modal";
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

// PUT /api/users/me, added in the backend's users-permissions extension. It
// writes only fullName, phone and email — and only ever to the row belonging to
// the JWT it was called with, since there is no id in the path for a caller to
// change. username is not sent: the backend derives it from the email.
const PROFILE_ENDPOINT = "/api/users/me";

const profileErrorMessage =
  "We couldn't save your profile right now. Please try again.";

// Mirrors validatePhone on the backend: 10 digits, tolerating the +91 / 91 / 0
// prefixes people type. Checked here only to save a round trip — the backend
// validates independently and remains the authority.
const phoneIsValid = (value) =>
  /^[0-9]{10}$/.test(
    value.trim().replace(/[\s()-]/g, "").replace(/^(?:\+?91|0)/, "")
  );

// The same pattern the auth forms and the backend both use.
const emailIsValid = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

// What the backend will store, shown back to the user before they commit to it.
const normalizeEmail = (value) => value.trim().toLowerCase();

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

// Same label/input/error shape the auth forms use, restyled for the account
// panel rather than the auth card.
const ProfileField = ({ id, label, error, ...props }) => (
  <div className="account-field">
    <label htmlFor={id}>{label}</label>
    <input
      id={id}
      aria-invalid={!!error}
      aria-describedby={error ? `${id}-error` : undefined}
      {...props}
    />
    {error && (
      <span id={`${id}-error`} className="account-field-error">
        {error}
      </span>
    )}
  </div>
);

const ProfilePanel = ({ user, applyUser }) => {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ fullName: "", phone: "", email: "" });
  const [fieldErrors, setFieldErrors] = useState({ phone: "", email: "" });
  const [feedback, setFeedback] = useState({ type: "", message: "" });
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);

  const startEditing = () => {
    setForm({
      fullName: user.fullName || "",
      phone: user.phone || "",
      email: user.email || "",
    });
    setFieldErrors({ phone: "", email: "" });
    setFeedback({ type: "", message: "" });
    setEditing(true);
  };

  const stopEditing = () => {
    setEditing(false);
    setFieldErrors({ phone: "", email: "" });
  };

  const setField = (field) => (event) => {
    const { value } = event.target;
    setForm((current) => ({ ...current, [field]: value }));
  };

  // Save only *asks*. Nothing is sent here — the request lives in confirmSave
  // below, so no API call can happen before the dialog is confirmed.
  const requestSave = (event) => {
    event.preventDefault();

    // Email is required — the backend rejects an empty one, since it is the
    // login identifier. Phone stays optional and is only checked when filled.
    const errors = {
      email: emailIsValid(form.email) ? "" : "Enter a valid email address.",
      phone:
        !form.phone.trim() || phoneIsValid(form.phone)
          ? ""
          : "Enter a 10-digit mobile number.",
    };

    setFieldErrors(errors);
    if (errors.email || errors.phone) return;

    setFeedback({ type: "", message: "" });
    setConfirming(true);
  };

  // Cancelling closes the dialog and leaves `form` exactly as it was, so the
  // user drops back into their edit with every unsaved change still there.
  const cancelSave = () => setConfirming(false);

  const confirmSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      // username is never sent: the backend derives it from the email itself.
      const { data } = await customerRequest("put", PROFILE_ENDPOINT, token, {
        fullName: form.fullName,
        phone: form.phone,
        email: form.email,
      });
      // Updated values come from the backend's own sanitised response, never
      // from the form, so the page can only show what the server accepted.
      // Spread over the existing user because this response is built by
      // user.edit() rather than user.me(), and the two need not carry an
      // identical field set — merging keeps rows like Member Since populated.
      applyUser({ ...user, ...data });
      setConfirming(false);
      setEditing(false);
      setFeedback({ type: "success", message: "Your profile has been updated." });
    } catch (error) {
      // Only our own validation messages are surfaced; anything else falls back
      // to the generic copy rather than putting a server error on the page.
      const message =
        error.response?.status === 400
          ? error.response?.data?.error?.message || profileErrorMessage
          : profileErrorMessage;
      setConfirming(false);
      setFeedback({ type: "error", message });
    } finally {
      setSaving(false);
    }
  };

  // Shown in the confirmation dialog. With no verification step, the address
  // being committed to has to be spelled out before the request goes out —
  // getting it wrong locks the account out of login.
  const nextEmail = normalizeEmail(form.email);
  const emailChanging = nextEmail !== normalizeEmail(user.email || "");
  const confirmMessage = emailChanging
    ? `You will sign in with ${nextEmail} from now on, and ${normalizeEmail(
        user.email || ""
      )} will stop working immediately. Check the new address carefully — we cannot verify it for you yet.`
    : "Your name and phone number will be updated on your Aha Rasam account.";

  return (
    <>
      <PanelHead
        title="Profile"
        intro="The details saved against your Aha Rasam account."
      />

      {editing ? (
        <form className="account-form" onSubmit={requestSave} noValidate>
          <ProfileField
            id="profile-full-name"
            label="Name"
            type="text"
            autoComplete="name"
            maxLength={200}
            value={form.fullName}
            onChange={setField("fullName")}
            disabled={saving}
          />
          <ProfileField
            id="profile-phone"
            label="Phone Number"
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            maxLength={20}
            value={form.phone}
            onChange={setField("phone")}
            error={fieldErrors.phone}
            disabled={saving}
          />
          <ProfileField
            id="profile-email"
            label="Email"
            type="email"
            autoComplete="email"
            maxLength={254}
            value={form.email}
            onChange={setField("email")}
            error={fieldErrors.email}
            disabled={saving}
          />
          {/* There is no verification step yet, so a typo here would lock the
              account out. Warn before the dialog, not only inside it. */}
          <p className="account-field-warning">
            Your email address is how you sign in. If you change it, use the new
            address next time — the old one will stop working immediately.
          </p>
          <div className="account-card">
            <DetailRow label="Member Since" value={formatDate(user.createdAt)} />
            <DetailRow
              label="Email Status"
              value={user.confirmed ? "Verified" : "Not verified"}
            />
          </div>
          <div className="account-form-actions">
            <button type="submit" className="account-primary-btn" disabled={saving}>
              Save Changes
            </button>
            <button
              type="button"
              className="account-secondary-btn"
              onClick={stopEditing}
              disabled={saving}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <>
          <div className="account-card">
            <DetailRow label="Name" value={user.fullName} />
            <DetailRow label="Email" value={user.email} />
            <DetailRow label="Phone Number" value={user.phone} />
            <DetailRow label="Member Since" value={formatDate(user.createdAt)} />
            <DetailRow
              label="Email Status"
              value={user.confirmed ? "Verified" : "Not verified"}
            />
          </div>
          <div className="account-form-actions">
            <button
              type="button"
              className="account-primary-btn"
              onClick={startEditing}
            >
              Edit Profile
            </button>
          </div>
        </>
      )}

      {feedback.type === "success" && (
        <p className="account-status" role="status">
          {feedback.message}
        </p>
      )}
      {feedback.type === "error" && (
        <p className="account-error" role="alert">
          {feedback.message}
        </p>
      )}

      <p className="account-panel-note">
        Your email address is also your sign-in name, so changing it here
        changes how you log in. Name and phone number are saved to your account
        for convenience — each order still keeps its own copy of the delivery
        details you enter at checkout, so updating them here never rewrites past
        orders.
      </p>

      <Modal
        show={confirming}
        title={emailChanging ? "Change your sign-in email?" : "Save profile changes?"}
        message={confirmMessage}
        onClose={cancelSave}
        onConfirm={confirmSave}
        confirmLabel={saving ? "Saving…" : "Yes, Save Changes"}
        cancelLabel="Cancel"
        busy={saving}
      />
    </>
  );
};

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
  const { user, logout, applyUser } = useAuth();
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
              {activeTab === "profile" && (
                <ProfilePanel user={user} applyUser={applyUser} />
              )}
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
