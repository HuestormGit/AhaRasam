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

// src/api/address on the backend: GET/POST /addresses and PUT/DELETE
// /addresses/:documentId. Like the orders endpoint, every one of them is scoped
// to the signed-in customer from the JWT — no user id is sent, and none would be
// honoured. No query string here at all: the backend ignores ctx.query and
// chooses its own filters, fields and sort.
const ADDRESSES_ENDPOINT = "/api/addresses";

const addressesErrorMessage =
  "We couldn't load your addresses right now. Please try again.";

const addressSaveErrorMessage =
  "We couldn't save this address right now. Please try again.";

const addressDeleteErrorMessage =
  "We couldn't delete this address right now. Please try again.";

// The backend's `label` enum. Kept as a controlled list rather than free text on
// both sides, so the card can switch on it without a fallback.
const ADDRESS_LABELS = [
  { value: "home", label: "Home" },
  { value: "work", label: "Work" },
  { value: "other", label: "Other" },
];

const addressLabelText = (value) =>
  ADDRESS_LABELS.find((entry) => entry.value === value)?.label || "Other";

// Mirrors MAX_ADDRESSES_PER_CUSTOMER in the address service. Used only to hide
// the Add button and explain why — the server enforces the limit itself and
// answers 409 regardless of what this constant says.
const MAX_ADDRESSES = 10;

const emptyAddressForm = {
  fullName: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  landmark: "",
  city: "",
  state: "",
  postalCode: "",
  label: "home",
};

// Mirrors validatePostalCode on the backend. Same reasoning as phoneIsValid:
// saves a round trip, decides nothing.
const pincodeIsValid = (value) => /^[0-9]{6}$/.test(value.trim());

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

// The same shape as useCustomerOrders above, with a setter: create, update and
// delete all answer with the customer's own rows, so the list is replaced from
// the server's response rather than refetched. Nothing is ever inserted into
// this state optimistically — what is on screen is always what the server last
// confirmed.
const useCustomerAddresses = (userId) => {
  const [state, setState] = useState({ status: "loading", addresses: [] });

  useEffect(() => {
    if (!userId) return undefined;

    let active = true;
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    setState({ status: "loading", addresses: [] });

    customerRequest("get", ADDRESSES_ENDPOINT, token)
      .then(({ data }) => {
        if (!active) return;
        setState({
          status: "ready",
          addresses: Array.isArray(data?.data) ? data.data : [],
        });
      })
      .catch(() => active && setState({ status: "error", addresses: [] }));

    return () => {
      active = false;
    };
  }, [userId]);

  const setAddresses = (addresses) => setState({ status: "ready", addresses });

  return { ...state, setAddresses };
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
//
// The label badge leads, because it is what the customer scans the list by; the
// Default badge sits beside it. Both are the panel's existing .account-badge.
const AddressCard = ({ address, busy, onEdit, onMakeDefault, onDelete }) => (
  <li className="account-address">
    <div className="account-address-head">
      <span className="account-badge account-badge-label">
        {addressLabelText(address.label)}
      </span>
      {address.isDefault && <span className="account-badge">Default</span>}
    </div>
    <h3>{address.fullName}</h3>
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
    <div className="account-address-actions">
      <button
        type="button"
        className="account-secondary-btn"
        onClick={() => onEdit(address)}
        disabled={busy}
      >
        Edit
      </button>
      {/* A default is set, never unset: an account with addresses always keeps
          exactly one, so the only move offered is promoting a different card. */}
      {!address.isDefault && (
        <button
          type="button"
          className="account-secondary-btn"
          onClick={() => onMakeDefault(address)}
          disabled={busy}
        >
          Set as Default
        </button>
      )}
      <button
        type="button"
        className="account-secondary-btn account-danger-btn"
        onClick={() => onDelete(address)}
        disabled={busy}
      >
        Delete
      </button>
    </div>
  </li>
);

// Native radios, no library. `label` is a controlled enum on both sides, so the
// three options are the whole input.
const AddressLabelField = ({ value, onChange, disabled }) => (
  <fieldset className="account-label-field">
    <legend>Address Type</legend>
    <div className="account-label-options">
      {ADDRESS_LABELS.map((option) => (
        <label key={option.value} htmlFor={`address-label-${option.value}`}>
          <input
            id={`address-label-${option.value}`}
            type="radio"
            name="address-label"
            value={option.value}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
            disabled={disabled}
          />
          {option.label}
        </label>
      ))}
    </div>
  </fieldset>
);

// One form for both add and edit — the two differ only in what seeds it and
// which request the panel sends. Fields reuse ProfileField, so an address input
// and a profile input are literally the same control.
const AddressForm = ({
  form,
  fieldErrors,
  saving,
  isEdit,
  onField,
  onLabel,
  onSubmit,
  onCancel,
}) => (
  <form className="account-form" onSubmit={onSubmit} noValidate>
    <ProfileField
      id="address-full-name"
      label="Recipient Name"
      type="text"
      autoComplete="name"
      maxLength={200}
      value={form.fullName}
      onChange={onField("fullName")}
      error={fieldErrors.fullName}
      disabled={saving}
    />
    <ProfileField
      id="address-phone"
      label="Phone Number"
      type="tel"
      inputMode="numeric"
      autoComplete="tel"
      maxLength={20}
      value={form.phone}
      onChange={onField("phone")}
      error={fieldErrors.phone}
      disabled={saving}
    />
    <ProfileField
      id="address-line-1"
      label="Address (House No. / Street)"
      type="text"
      autoComplete="address-line1"
      maxLength={200}
      value={form.addressLine1}
      onChange={onField("addressLine1")}
      error={fieldErrors.addressLine1}
      disabled={saving}
    />
    <ProfileField
      id="address-line-2"
      label="Apartment / Area (optional)"
      type="text"
      autoComplete="address-line2"
      maxLength={200}
      value={form.addressLine2}
      onChange={onField("addressLine2")}
      disabled={saving}
    />
    <ProfileField
      id="address-landmark"
      label="Landmark (optional)"
      type="text"
      maxLength={200}
      value={form.landmark}
      onChange={onField("landmark")}
      disabled={saving}
    />
    <ProfileField
      id="address-city"
      label="City"
      type="text"
      autoComplete="address-level2"
      maxLength={200}
      value={form.city}
      onChange={onField("city")}
      error={fieldErrors.city}
      disabled={saving}
    />
    <ProfileField
      id="address-state"
      label="State"
      type="text"
      autoComplete="address-level1"
      maxLength={200}
      value={form.state}
      onChange={onField("state")}
      error={fieldErrors.state}
      disabled={saving}
    />
    <ProfileField
      id="address-postal-code"
      label="PIN Code"
      type="text"
      inputMode="numeric"
      autoComplete="postal-code"
      maxLength={6}
      value={form.postalCode}
      onChange={onField("postalCode")}
      error={fieldErrors.postalCode}
      disabled={saving}
    />
    <AddressLabelField
      value={form.label}
      onChange={onLabel}
      disabled={saving}
    />
    <div className="account-form-actions">
      <button type="submit" className="account-primary-btn" disabled={saving}>
        {saving ? "Saving…" : isEdit ? "Save Address" : "Add Address"}
      </button>
      <button
        type="button"
        className="account-secondary-btn"
        onClick={onCancel}
        disabled={saving}
      >
        Cancel
      </button>
    </div>
  </form>
);

// The backend's controlled error envelope: { error: { status, name, message,
// details } }. 400 and 409 carry a message written for the customer (a failed
// field rule, the saved-address limit), so those are surfaced; anything else
// falls back to the generic copy rather than putting a server error on the page.
// Same rule ProfilePanel already applies to its own save.
const addressError = (error, fallback) => {
  const status = error.response?.status;
  return status === 400 || status === 409
    ? error.response?.data?.error?.message || fallback
    : fallback;
};

const AddressesPanel = ({ status, addresses, setAddresses }) => {
  // null = list only, "new" = add form, documentId = edit form for that card.
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyAddressForm);
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [promoting, setPromoting] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  // Any request in flight locks every card's actions, so a second write cannot
  // be started against a list that is about to be replaced.
  const busy = saving || deleting || promoting;
  const atLimit = addresses.length >= MAX_ADDRESSES;

  const token = () => localStorage.getItem(AUTH_TOKEN_KEY);

  const startAdding = () => {
    setForm(emptyAddressForm);
    setFieldErrors({});
    setFeedback({ type: "", message: "" });
    setEditing("new");
  };

  const startEditing = (address) => {
    setForm({
      fullName: address.fullName || "",
      phone: address.phone || "",
      addressLine1: address.addressLine1 || "",
      addressLine2: address.addressLine2 || "",
      landmark: address.landmark || "",
      city: address.city || "",
      state: address.state || "",
      postalCode: address.postalCode || "",
      label: address.label || "home",
    });
    setFieldErrors({});
    setFeedback({ type: "", message: "" });
    setEditing(address.documentId);
  };

  const stopEditing = () => {
    setEditing(null);
    setFieldErrors({});
  };

  const setField = (field) => (event) => {
    const { value } = event.target;
    setForm((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: "" }));
  };

  const setLabel = (value) =>
    setForm((current) => ({ ...current, label: value }));

  // Mirrors the backend's validators so an obvious mistake costs no round trip.
  // The backend validates independently and remains the authority.
  const validate = () => {
    const errors = {};
    if (!form.fullName.trim()) errors.fullName = "Recipient name is required.";
    if (!form.phone.trim()) errors.phone = "Phone number is required.";
    else if (!phoneIsValid(form.phone))
      errors.phone = "Enter a 10-digit mobile number.";
    if (!form.addressLine1.trim())
      errors.addressLine1 = "Address is required.";
    if (!form.city.trim()) errors.city = "City is required.";
    if (!form.state.trim()) errors.state = "State is required.";
    if (!form.postalCode.trim()) errors.postalCode = "PIN code is required.";
    else if (!pincodeIsValid(form.postalCode))
      errors.postalCode = "Enter a 6-digit PIN code.";

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!validate()) return;

    const isEdit = editing !== "new";
    setSaving(true);
    setFeedback({ type: "", message: "" });

    try {
      // The whole form, every time. isDefault is deliberately absent: the
      // backend decides it (first address wins it) and the Set as Default
      // button is the only thing that moves it.
      const { data } = await customerRequest(
        isEdit ? "put" : "post",
        isEdit ? `${ADDRESSES_ENDPOINT}/${editing}` : ADDRESSES_ENDPOINT,
        token(),
        form
      );
      // Mutations answer with the customer's full list, so the promoted
      // default and the cleared one both land in the same update.
      setAddresses(Array.isArray(data?.data) ? data.data : []);
      setEditing(null);
      setFeedback({
        type: "success",
        message: isEdit ? "Address updated." : "Address saved.",
      });
    } catch (error) {
      setFeedback({
        type: "error",
        message: addressError(error, addressSaveErrorMessage),
      });
    } finally {
      setSaving(false);
    }
  };

  const makeDefault = async (address) => {
    setPromoting(true);
    setFeedback({ type: "", message: "" });
    try {
      // Only the flag. The partial update on the backend leaves every other
      // field of this address untouched.
      const { data } = await customerRequest(
        "put",
        `${ADDRESSES_ENDPOINT}/${address.documentId}`,
        token(),
        { isDefault: true }
      );
      setAddresses(Array.isArray(data?.data) ? data.data : []);
      setFeedback({ type: "success", message: "Default address updated." });
    } catch (error) {
      setFeedback({
        type: "error",
        message: addressError(error, addressSaveErrorMessage),
      });
    } finally {
      setPromoting(false);
    }
  };

  // Delete only *asks*. The request lives in confirmDelete, so nothing is sent
  // until the dialog is confirmed — the same split ProfilePanel uses for save.
  const requestDelete = (address) => {
    setFeedback({ type: "", message: "" });
    setPendingDelete(address);
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      const { data } = await customerRequest(
        "delete",
        `${ADDRESSES_ENDPOINT}/${pendingDelete.documentId}`,
        token()
      );
      // Deleting the default promotes a successor on the server, so again the
      // list comes back rather than a removal being guessed at here.
      setAddresses(Array.isArray(data?.data) ? data.data : []);
      setPendingDelete(null);
      // An open edit form for the deleted card would now point at nothing.
      if (editing === pendingDelete.documentId) setEditing(null);
      setFeedback({ type: "success", message: "Address deleted." });
    } catch (error) {
      setPendingDelete(null);
      setFeedback({
        type: "error",
        message: addressError(error, addressDeleteErrorMessage),
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <PanelHead
        title="Addresses"
        intro="Delivery addresses saved to your account."
      />

      {status === "loading" && (
        <p className="account-status" role="status">
          Loading your addresses…
        </p>
      )}

      {status === "error" && (
        <p className="account-error" role="alert">
          {addressesErrorMessage}
        </p>
      )}

      {status === "ready" && (
        <>
          {addresses.length > 0 ? (
            <ul className="account-address-list">
              {addresses.map((address) => (
                <AddressCard
                  key={address.documentId}
                  address={address}
                  busy={busy}
                  onEdit={startEditing}
                  onMakeDefault={makeDefault}
                  onDelete={requestDelete}
                />
              ))}
            </ul>
          ) : (
            !editing && (
              <EmptyState title="No saved addresses">
                You have not saved any addresses yet. Add one to reuse it next
                time you order.
              </EmptyState>
            )
          )}

          {editing ? (
            <AddressForm
              form={form}
              fieldErrors={fieldErrors}
              saving={saving}
              isEdit={editing !== "new"}
              onField={setField}
              onLabel={setLabel}
              onSubmit={submit}
              onCancel={stopEditing}
            />
          ) : (
            <div className="account-form-actions">
              <button
                type="button"
                className="account-primary-btn"
                onClick={startAdding}
                disabled={busy || atLimit}
              >
                Add Address
              </button>
            </div>
          )}

          {/* The server enforces the limit and answers 409 whatever this says;
              hiding the button early just avoids a form that cannot be saved. */}
          {atLimit && !editing && (
            <p className="account-status" role="status">
              You have saved the maximum of {MAX_ADDRESSES} addresses. Delete one
              to add another.
            </p>
          )}
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
        Saved addresses are for convenience only. Each order keeps its own copy
        of the delivery details used at the time, so editing or deleting an
        address here never changes an order you have already placed.
      </p>

      <Modal
        show={!!pendingDelete}
        title="Delete this address?"
        message={
          pendingDelete
            ? `${pendingDelete.fullName}, ${pendingDelete.addressLine1} will be removed from your account. Orders already placed keep their own delivery details.`
            : ""
        }
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
        confirmLabel={deleting ? "Deleting…" : "Yes, Delete"}
        cancelLabel="Cancel"
        busy={deleting}
      />
    </>
  );
};

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
  const {
    status: addressesStatus,
    addresses,
    setAddresses,
  } = useCustomerAddresses(user.id);

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
              {activeTab === "addresses" && (
                <AddressesPanel
                  status={addressesStatus}
                  addresses={addresses}
                  setAddresses={setAddresses}
                />
              )}
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
