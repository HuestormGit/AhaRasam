// Strapi stores every amount as integer minor units (paise): 17100 === ₹171.00.
// The cart, the existing UI and the Razorpay create endpoint all speak rupees,
// so convert at the edges and keep the cart shape (item.price in rupees) intact.

export const minorToRupees = (minor) => (Number(minor) || 0) / 100;

export const rupeesToMinor = (rupees) => Math.round((Number(rupees) || 0) * 100);

// Whole rupees stay "171" exactly as before; only paise get the .50 tail.
export const formatAmount = (rupees) => {
  const minor = rupeesToMinor(rupees);
  return minor % 100 === 0 ? String(minor / 100) : (minor / 100).toFixed(2);
};

export const formatMinor = (minor) =>
  Number.isSafeInteger(minor) ? (minor / 100).toFixed(2) : "0.00";

// Display label only — never a tax calculation. Callers pass server data that
// may be null, partial or still loading (a default parameter only covers
// undefined), so anything that is not a usable single rate falls back to the
// plain "GST" heading rather than rendering "GST @ NaN%".
export const gstSummaryLabel = (items) => {
  if (!Array.isArray(items) || items.length === 0) return "GST";
  const rates = new Set(items.map((item) => item?.gstRateBps));
  const [rate] = rates;
  // One rate, shared by every line, and actually a number: anything else
  // (a missing rate on one line included) is not safe to name.
  return rates.size === 1 && Number.isSafeInteger(rate)
    ? `GST @ ${rate / 100}%`
    : "GST";
};
