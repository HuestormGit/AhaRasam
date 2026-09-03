import { useCallback, useEffect, useMemo, useState } from "react";
import { apiClient } from "../utils/Api";

// Session-scoped on purpose: a delivery rate is only good for this visit, and it
// is UX only. Payment creation will re-quote it server-side.
export const DELIVERY_STORAGE_KEY = "ahaRasamDelivery";

export const PINCODE_PATTERN = /^[0-9]{6}$/;

export const pincodeErrorMessage = "Enter a valid 6-digit pincode.";
export const unserviceableMessage =
  "Delivery is currently unavailable to this pincode.";
// A provider outage is not "we do not deliver there", so it never reuses the
// unserviceable copy.
export const deliveryErrorMessage =
  "We couldn't check delivery availability right now. Please try again.";

const isMoney = (value) => Number.isSafeInteger(value) && value >= 0;
const isText = (value) => typeof value === "string" && value.trim() !== "";

// The live backend tags every option; the fixture sends one untyped option, so
// type is optional — but when it is there it must be one we understand.
const DELIVERY_TYPES = ["standard", "express"];
const isValidType = (type) => type === undefined || DELIVERY_TYPES.includes(type);

const isValidOption = (option) =>
  !!option &&
  isText(option.id) &&
  isText(option.label) &&
  isMoney(option.shippingPaise) &&
  isMoney(option.estimatedDaysMin) &&
  isMoney(option.estimatedDaysMax) &&
  option.estimatedDaysMin <= option.estimatedDaysMax &&
  isValidType(option.type);

// Defence in depth at the trust boundary: the backend allowlists its response,
// but only these fields are ever kept, shown or handed to checkout — so no
// courier name, rating or provider internal can reach the UI or sessionStorage.
const pickOption = (option) => ({
  id: option.id,
  ...(option.type ? { type: option.type } : {}),
  label: option.label,
  shippingPaise: option.shippingPaise,
  estimatedDaysMin: option.estimatedDaysMin,
  estimatedDaysMax: option.estimatedDaysMax,
});

// Only a type ("express") and an id are remembered across a re-check — never a
// price, an ETA or the option object, so a stale rate can never survive. The
// pick is always resolved against the options from the newest response.
const selectFrom = (options, preference) =>
  (preference && options.find((option) => option.type === preference.type)) ||
  (preference && options.find((option) => option.id === preference.id)) ||
  options.find((option) => option.type === "standard") ||
  options[0] ||
  null;

export const formatDeliveryEstimate = (option) => {
  if (!option) return "";
  const { estimatedDaysMin: min, estimatedDaysMax: max } = option;
  return min === max ? `${min} ${min === 1 ? "day" : "days"}` : `${min}–${max} days`;
};

export const readStoredDelivery = () => {
  try {
    const stored = JSON.parse(sessionStorage.getItem(DELIVERY_STORAGE_KEY));
    if (!stored || !PINCODE_PATTERN.test(stored.destinationPincode || "")) return null;
    return isValidOption(stored.option) ? stored : null;
  } catch {
    return null; // blocked or corrupted storage — just ask again
  }
};

const writeStoredDelivery = (value) => {
  try {
    if (value) sessionStorage.setItem(DELIVERY_STORAGE_KEY, JSON.stringify(value));
    else sessionStorage.removeItem(DELIVERY_STORAGE_KEY);
  } catch {
    /* storage blocked: display-only state, nothing to recover */
  }
};

const idle = { status: "idle", options: [], pincode: "" };

export const useDeliveryCheck = (cartData = []) => {
  const requestItems = cartData.map((item) => ({
    productDocumentId: item.productDocumentId,
    variantDocumentId: item.variantDocumentId,
    quantity: item.qty,
  }));
  const requestKey = JSON.stringify(requestItems);

  const stored = useMemo(readStoredDelivery, []);
  const [pincode, setPincodeValue] = useState(stored?.destinationPincode || "");
  const [pincodeError, setPincodeError] = useState("");
  // A submit is a fresh object every time, so Retry and a re-Check both re-run
  // the effect below.
  const [submitted, setSubmitted] = useState(
    stored ? { pincode: stored.destinationPincode } : null
  );
  const [state, setState] = useState(idle);
  // { type, id } of what the customer picked. Cleared when the pincode changes.
  const [preference, setPreference] = useState(null);

  useEffect(() => {
    if (!submitted || !requestItems.length) {
      setState((prev) => (prev.status === "idle" ? prev : idle));
      return undefined;
    }

    let active = true;
    setState({ status: "checking", options: [], pincode: submitted.pincode });

    apiClient
      .post("/api/checkout/shipping-options", {
        destinationPincode: submitted.pincode,
        items: requestItems,
      })
      .then(({ data }) => {
        const result = data?.data;
        if (
          !result ||
          result.destinationPincode !== submitted.pincode ||
          typeof result.serviceable !== "boolean" ||
          !Array.isArray(result.options)
        ) {
          throw new Error("Invalid shipping response");
        }
        if (!result.serviceable) {
          if (active) {
            setState({ status: "unserviceable", options: [], pincode: submitted.pincode });
          }
          return;
        }
        const ids = new Set(result.options.map((option) => option.id));
        if (
          !result.options.length ||
          !result.options.every(isValidOption) ||
          // Duplicate ids would make the radio group ambiguous, so the whole
          // response is unusable rather than partly rendered.
          ids.size !== result.options.length
        ) {
          throw new Error("Invalid shipping response");
        }
        if (active) {
          setState({
            status: "ready",
            options: result.options.map(pickOption),
            pincode: submitted.pincode,
          });
        }
      })
      .catch(() => {
        if (active) {
          setState({ status: "error", options: [], pincode: submitted.pincode });
        }
      });

    return () => {
      active = false;
    };
    // requestKey is a stable serialization of the cart lines being shipped; a
    // cart change re-checks the same pincode instead of reusing a stale rate.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestKey, submitted]);

  // The result belongs to the pincode that was checked. Editing the field
  // invalidates the rate, the ETA and the total that came with it.
  const current = state.pincode === pincode ? state : idle;
  // Derived, never stored: whatever is selected is an option from the response
  // currently on screen. Standard wins by default; Express only by choice.
  const selectedOption =
    current.status === "ready" ? selectFrom(current.options, preference) : null;

  // Picking an option only re-reads the rates already fetched — no new request.
  const selectOption = (id) => {
    const option = current.options.find((entry) => entry.id === id);
    if (option) setPreference({ type: option.type, id: option.id });
  };

  useEffect(() => {
    writeStoredDelivery(
      selectedOption
        ? { destinationPincode: pincode, option: selectedOption }
        : null
    );
  }, [pincode, selectedOption]);

  const setPincode = useCallback((value) => {
    setPincodeValue(String(value).replace(/[^0-9]/g, "").slice(0, 6));
    setPincodeError("");
    // A new destination starts from Standard: an Express preference earned at
    // one pincode says nothing about what is worth paying for at another.
    setPreference(null);
  }, []);

  const check = useCallback(() => {
    if (!PINCODE_PATTERN.test(pincode)) {
      setPincodeError(pincodeErrorMessage);
      return;
    }
    setPincodeError("");
    setSubmitted({ pincode });
  }, [pincode]);

  return {
    pincode,
    setPincode,
    pincodeError,
    check,
    retry: check,
    status: current.status, // idle | checking | ready | unserviceable | error
    options: current.options,
    selectedOption,
    selectOption,
  };
};
