import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuth } from "./AuthContext";
import { AUTH_TOKEN_KEY, customerRequest } from "../utils/Api";

// The orders fetch and the unseen count live here rather than on the Account
// page because two places need them and only one of those is ever mounted:
// MyHeader sits outside <Routes> and is on screen everywhere, while Account
// exists only on /account. A provider above both is what lets the navbar dot
// and the Orders tab badge agree without fetching the order list twice.
//
// src/api/order/routes/order.js lists GET /orders alongside the Razorpay
// payment routes, so the collection is readable. The backend scopes the read
// to the signed-in customer from the JWT and ignores the query below entirely
// — the filter is kept only so the request reads like any other Strapi list
// call, and a slimmer query would buy nothing.
const ORDERS_ENDPOINT = "/api/orders";

const ordersQuery = (userId) =>
  `${ORDERS_ENDPOINT}?filters[customer][id][$eq]=${userId}` +
  "&populate=orderItems&sort=createdAt:desc";

// Unseen orders are tracked in the browser, not the backend: the order model
// has no per-customer read state, and adding one would be a schema change made
// to carry a badge. The whole state is one ISO timestamp per customer — the
// last time they had the Orders tab open. Keyed by user id, so a second
// customer signing in on this browser never inherits the first one's.
const ORDERS_SEEN_KEY = "ahaRasamOrdersSeen";

const seenKey = (userId) => `${ORDERS_SEEN_KEY}:${userId}`;

const readSeenAt = (userId) => {
  try {
    return localStorage.getItem(seenKey(userId)) || "";
  } catch {
    return "";
  }
};

const writeSeenAt = (userId, value) => {
  try {
    localStorage.setItem(seenKey(userId), value);
  } catch {
    // Private mode, or a full quota. The badge is a convenience; losing it is
    // not worth breaking the page the customer came here to use.
  }
};

const AccountNotificationsContext = createContext(null);

export const AccountNotificationsProvider = ({ children }) => {
  const { user } = useAuth();
  const userId = user?.id;
  const [state, setState] = useState({ status: "loading", orders: [] });
  const [seenAt, setSeenAt] = useState("");

  useEffect(() => {
    // No session: drop the previous customer's orders and watermark, so
    // logging out cannot leave their dot on screen for whoever signs in next.
    if (!userId) {
      setState({ status: "loading", orders: [] });
      setSeenAt("");
      return undefined;
    }

    let active = true;
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    // Read alongside the fetch rather than in a useState initialiser: this
    // provider mounts before AuthContext has restored the session, so the
    // customer whose watermark to read is not known until userId arrives.
    setSeenAt(readSeenAt(userId));
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

  const { status, orders } = state;

  // createdAt is a UTC ISO-8601 string, so comparing the strings orders them
  // without parsing a Date per order. Reduced rather than read off orders[0],
  // so the count cannot silently depend on the query's sort.
  const newest = orders.reduce(
    (latest, order) => (order.createdAt > latest ? order.createdAt : latest),
    ""
  );

  // What a first load writes when this browser holds no watermark yet. With
  // orders, the newest of them: history placed before this badge existed is
  // not news. With none, the account's own creation date, because no order can
  // predate it — that is what makes a customer's first-ever order count as
  // unseen rather than silently seeding the watermark past it. Both values are
  // the server's own, so a wrong browser clock cannot shift the comparison.
  const baseline = newest || user?.createdAt || "";

  useEffect(() => {
    // "ready" carries real weight here. Until the fetch lands orders is empty,
    // so the baseline would fall back to the account date — seeding there for
    // a customer who does have history would announce every past order as new.
    if (status !== "ready" || seenAt || !baseline) return;
    writeSeenAt(userId, baseline);
    setSeenAt(baseline);
  }, [status, seenAt, baseline, userId]);

  // Called by the Account page while its Orders panel is on screen. Idempotent,
  // so it is safe to call from an effect that reruns.
  const markOrdersSeen = useCallback(() => {
    if (!userId || !newest || newest === seenAt) return;
    writeSeenAt(userId, newest);
    setSeenAt(newest);
  }, [userId, newest, seenAt]);

  const unseenOrders = seenAt
    ? orders.filter((order) => order.createdAt > seenAt).length
    : 0;

  const value = useMemo(
    () => ({
      orders,
      ordersStatus: status,
      unseenOrders,
      // The one flag the navbar reads. When another Account tab grows a
      // notification of its own, OR its count in here and the header needs no
      // change at all.
      hasUnseen: unseenOrders > 0,
      markOrdersSeen,
    }),
    [orders, status, unseenOrders, markOrdersSeen]
  );

  return (
    <AccountNotificationsContext.Provider value={value}>
      {children}
    </AccountNotificationsContext.Provider>
  );
};

export const useAccountNotifications = () =>
  useContext(AccountNotificationsContext);
