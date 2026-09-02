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

const quoteErrorMessage =
  "We couldn't refresh the latest price details. Please review your cart and try again.";

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
  });

  useEffect(() => {
    if (!requestItems.length) {
      setState({ requestKey, quote: null, loading: false, error: "" });
      return undefined;
    }

    let active = true;
    setState({ requestKey, quote: null, loading: true, error: "" });

    apiClient
      .post("/api/checkout/quote", { items: requestItems })
      .then(({ data }) => {
        const quote = data?.data;
        if (!isValidQuote(quote, requestItems)) {
          throw new Error("Invalid quote response");
        }
        if (active) setState({ requestKey, quote, loading: false, error: "" });
      })
      .catch(() => {
        if (active) {
          setState({
            requestKey,
            quote: null,
            loading: false,
            error: quoteErrorMessage,
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
    retryQuote,
  };
};
