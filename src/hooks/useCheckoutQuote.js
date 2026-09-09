import { useCallback, useEffect, useState } from "react";
import { apiClient } from "../utils/Api";

const aggregateMoneyFields = [
  "mrpTotalPaise",
  "discountTotalPaise",
  "taxableSubtotalPaise",
  "gstTotalPaise",
  "subtotalPaise",
  "shippingPaise",
  "totalPaise",
];
const itemMoneyFields = [
  "unitMrpPaise",
  "unitDiscountPaise",
  "unitTaxableBasePaise",
  "unitGstPaise",
  "unitSellingPricePaise",
  "gstRateBps",
  "lineMrpPaise",
  "lineDiscountPaise",
  "lineTaxableBasePaise",
  "lineGstPaise",
  "lineTotalPaise",
];
const isMoney = (value) => Number.isSafeInteger(value) && value >= 0;

const isValidQuote = (quote, requestItems) => {
  if (
    !quote ||
    quote.currency !== "INR" ||
    !Array.isArray(quote.items) ||
    quote.items.length !== requestItems.length ||
    !aggregateMoneyFields.every((field) => isMoney(quote[field]))
  ) {
    return false;
  }

  if (
    !quote.items.every((item, index) => {
      const requestItem = requestItems[index];
      return (
        item.productDocumentId === requestItem.productDocumentId &&
        item.variantDocumentId === requestItem.variantDocumentId &&
        item.quantity === requestItem.quantity &&
        itemMoneyFields.every((field) => isMoney(item[field]))
      );
    })
  ) {
    return false;
  }

  return (
    quote.mrpTotalPaise - quote.discountTotalPaise === quote.subtotalPaise &&
    quote.taxableSubtotalPaise + quote.gstTotalPaise === quote.subtotalPaise &&
    quote.subtotalPaise + quote.shippingPaise === quote.totalPaise
  );
};

// Every category the cart can actually distinguish. The customer only ever
// sees the message; the reason stays a code, and no backend text, status or
// stack ever reaches the screen.
export const QUOTE_ERRORS = {
  // The catalogue can no longer sell one of these lines — a deleted, renewed or
  // deactivated variant. The only failure the customer can do something about.
  CART_ITEM_UNAVAILABLE:
    "One or more items in your cart are no longer available. Please remove them and add them again.",
  // We asked badly, or the server answered with something we refuse to price.
  INVALID_REQUEST:
    "We couldn't refresh the latest price details. Please review your cart and try again.",
  INVALID_RESPONSE:
    "We couldn't refresh the latest price details. Please review your cart and try again.",
  // Nothing wrong with the cart: retrying is genuinely worth it.
  SERVER_ERROR:
    "We couldn't reach our pricing service just now. Please try again in a moment.",
  NETWORK_ERROR:
    "We couldn't reach our pricing service just now. Please try again in a moment.",
};

const classifyQuoteError = (error) => {
  if (error?.isInvalidQuoteResponse) return "INVALID_RESPONSE";
  const response = error?.response;
  if (!response) return "NETWORK_ERROR";
  if (response.status >= 500) return "SERVER_ERROR";
  return response.data?.error?.details?.code === "CART_ITEM_UNAVAILABLE"
    ? "CART_ITEM_UNAVAILABLE"
    : "INVALID_REQUEST";
};

export const useCheckoutQuote = (cartData = []) => {
  const requestItems = cartData.map((item) => ({
    productDocumentId: item.productDocumentId,
    variantDocumentId: item.variantDocumentId,
    quantity: item.qty,
  }));
  const requestKey = JSON.stringify(requestItems);
  const [retryCount, setRetryCount] = useState(0);
  const [state, setState] = useState({
    requestKey: "",
    quote: null,
    loading: cartData.length > 0,
    error: "",
    errorCode: "",
  });

  useEffect(() => {
    if (!requestItems.length) {
      setState({ requestKey, quote: null, loading: false, error: "", errorCode: "" });
      return undefined;
    }

    let active = true;
    setState({ requestKey, quote: null, loading: true, error: "", errorCode: "" });

    apiClient
      .post("/api/checkout/quote", { items: requestItems })
      .then(({ data }) => {
        const quote = data?.data;
        if (!isValidQuote(quote, requestItems)) {
          const error = new Error("Invalid quote response");
          error.isInvalidQuoteResponse = true;
          throw error;
        }
        if (active) {
          setState({ requestKey, quote, loading: false, error: "", errorCode: "" });
        }
      })
      .catch((error) => {
        if (active) {
          const errorCode = classifyQuoteError(error);
          setState({
            requestKey,
            quote: null,
            loading: false,
            error: QUOTE_ERRORS[errorCode],
            errorCode,
          });
        }
      });

    return () => {
      active = false;
    };
    // requestKey is a stable serialization of the exact request payload.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestKey, retryCount]);

  const isCurrent = state.requestKey === requestKey;
  const retryQuote = useCallback(() => setRetryCount((count) => count + 1), []);
  return {
    quote: isCurrent ? state.quote : null,
    quoteLoading: !!cartData.length && (!isCurrent || state.loading),
    quoteError: isCurrent ? state.error : "",
    quoteErrorCode: isCurrent ? state.errorCode : "",
    retryQuote,
  };
};
