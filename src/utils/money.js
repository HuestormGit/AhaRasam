// Strapi stores every amount as integer minor units (paise): 17100 === ₹171.00.
// The cart, the existing UI and the Razorpay create endpoint all speak rupees,
// so convert at the edges and keep the cart shape (item.price in rupees) intact.

export const minorToRupees = (minor) => (Number(minor) || 0) / 100;

export const rupeesToMinor = (rupees) => Math.round((Number(rupees) || 0) * 100);

// Totals are summed in paise so ₹99.50 × 3 cannot render as 298.50000000000006.
export const cartTotalMinor = (cart = []) =>
  cart.reduce(
    (sum, item) => sum + rupeesToMinor(item.price) * (Number(item.qty) || 0),
    0
  );

// Whole rupees stay "171" exactly as before; only paise get the .50 tail.
export const formatAmount = (rupees) => {
  const minor = rupeesToMinor(rupees);
  return minor % 100 === 0 ? String(minor / 100) : (minor / 100).toFixed(2);
};

export const formatMinor = (minor) =>
  Number.isSafeInteger(minor) ? (minor / 100).toFixed(2) : "0.00";

export const gstSummaryLabel = (items = []) => {
  const rates = [...new Set(items.map((item) => item.gstRateBps))];
  return rates.length === 1 ? `GST @ ${rates[0] / 100}%` : "GST";
};
