import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import Cart from "./Cart";
import { CartProvider } from "../../context/CartContext";
import { apiClient } from "../../utils/Api";

const mockNavigate = jest.fn();

jest.mock(
  "react-router-dom",
  () => ({ useNavigate: () => mockNavigate }),
  { virtual: true }
);

jest.mock("../../utils/Api", () => ({
  apiClient: { post: jest.fn() },
}));

const cartItem = (overrides = {}) => ({
  productDocumentId: "product-a",
  variantDocumentId: "variant-a",
  productName: "Manipulated browser name",
  size: "browser size",
  price: 0.01,
  qty: 1,
  ...overrides,
});

const quote = (quantity = 1) => ({
  currency: "INR",
  items: [
    {
      productDocumentId: "product-a",
      variantDocumentId: "variant-a",
      productName: "Classic",
      sku: "AHA-CLASSIC-250",
      size: "250gms",
      quantity,
      unitMrpPaise: 10500,
      unitDiscountPaise: 1050,
      unitTaxableBasePaise: 9000,
      unitGstPaise: 450,
      unitSellingPricePaise: 9450,
      gstRateBps: 500,
      lineMrpPaise: 10500 * quantity,
      lineDiscountPaise: 1050 * quantity,
      lineTaxableBasePaise: 9000 * quantity,
      lineGstPaise: 450 * quantity,
      lineTotalPaise: 9450 * quantity,
    },
  ],
  mrpTotalPaise: 10500 * quantity,
  discountTotalPaise: 1050 * quantity,
  taxableSubtotalPaise: 9000 * quantity,
  gstTotalPaise: 450 * quantity,
  subtotalPaise: 9450 * quantity,
  shippingPaise: 0,
  totalPaise: 9450 * quantity,
});

const multipleQuote = {
  currency: "INR",
  items: [
    quote().items[0],
    {
      productDocumentId: "product-b",
      variantDocumentId: "variant-b",
      productName: "Pepper Rasam",
      sku: "AHA-PEPPER-100",
      size: "100gms",
      quantity: 1,
      unitMrpPaise: 12000,
      unitDiscountPaise: 1000,
      unitTaxableBasePaise: 10000,
      unitGstPaise: 1000,
      unitSellingPricePaise: 11000,
      gstRateBps: 1000,
      lineMrpPaise: 12000,
      lineDiscountPaise: 1000,
      lineTaxableBasePaise: 10000,
      lineGstPaise: 1000,
      lineTotalPaise: 11000,
    },
  ],
  mrpTotalPaise: 22500,
  discountTotalPaise: 2050,
  taxableSubtotalPaise: 19000,
  gstTotalPaise: 1450,
  subtotalPaise: 20450,
  shippingPaise: 0,
  totalPaise: 20450,
};

const response = (data = quote()) => Promise.resolve({ data: { data } });

const renderCart = (items = [cartItem()]) => {
  localStorage.setItem("cartList", JSON.stringify(items));
  return render(
    <CartProvider>
      <Cart />
    </CartProvider>
  );
};

beforeEach(() => {
  localStorage.clear();
  apiClient.post.mockReset();
  mockNavigate.mockReset();
});

test("requests only stable IDs and quantity and renders authoritative price details", async () => {
  apiClient.post.mockImplementation(() => response());
  renderCart();

  await waitFor(() =>
    expect(apiClient.post).toHaveBeenCalledWith("/api/checkout/quote", {
      items: [
        {
          productDocumentId: "product-a",
          variantDocumentId: "variant-a",
          quantity: 1,
        },
      ],
    })
  );

  const summary = await screen.findByRole("region", { name: "Order Summary" });
  expect(screen.getByRole("cell", { name: "₹105.00" })).toHaveAttribute(
    "data-label",
    "MRP (line)"
  );
  expect(screen.getByRole("cell", { name: "-₹10.50" })).toHaveAttribute(
    "data-label",
    "Discount (line)"
  );
  expect(screen.getByRole("cell", { name: "₹94.50" })).toHaveAttribute(
    "data-label",
    "Price (line total)"
  );
  expect(within(summary).getByText("₹105.00")).toBeInTheDocument();
  expect(within(summary).getByText("-₹10.50")).toBeInTheDocument();
  expect(within(summary).getByText("₹90.00")).toBeInTheDocument();
  expect(within(summary).getByText("GST @ 5%")).toBeInTheDocument();
  expect(within(summary).getByText("₹4.50")).toBeInTheDocument();
  expect(within(summary).getByText("₹94.50")).toBeInTheDocument();
  expect(within(summary).getByText("Calculated at checkout")).toBeInTheDocument();
  expect(screen.queryByText("Manipulated browser name")).toBeNull();
  expect(screen.queryByText("₹0.01")).toBeNull();

  fireEvent.click(screen.getByRole("button", { name: "Proceed To Checkout" }));
  expect(mockNavigate).toHaveBeenCalledWith("/checkout");
});

test("shows loading placeholders without flashing cached totals", () => {
  apiClient.post.mockReturnValue(new Promise(() => {}));
  renderCart();

  expect(screen.getByRole("status")).toHaveTextContent("Calculating price details");
  expect(screen.getAllByText("—")).toHaveLength(3);
  expect(screen.queryByRole("region", { name: "Order Summary" })).toBeNull();
  expect(screen.queryByText("₹0.01")).toBeNull();
});

test("shows a safe error and retries the quote", async () => {
  apiClient.post
    .mockRejectedValueOnce(new Error("private database detail"))
    .mockImplementationOnce(() => response());
  renderCart();

  const alert = await screen.findByRole("alert");
  expect(alert).toHaveTextContent("We couldn't refresh the latest price details");
  expect(alert).not.toHaveTextContent("private database detail");
  expect(screen.getByRole("button", { name: "Proceed To Checkout" })).toBeDisabled();

  fireEvent.click(screen.getByRole("button", { name: "Retry" }));
  expect(await screen.findByRole("region", { name: "Order Summary" })).toBeInTheDocument();
  expect(apiClient.post).toHaveBeenCalledTimes(2);
});

test("refreshes every authoritative amount after a quantity change", async () => {
  apiClient.post
    .mockImplementationOnce(() => response(quote(1)))
    .mockImplementationOnce(() => response(quote(2)));
  renderCart();

  await screen.findByRole("region", { name: "Order Summary" });
  fireEvent.click(screen.getByRole("button", { name: "Increase Classic quantity" }));

  await waitFor(() =>
    expect(apiClient.post).toHaveBeenLastCalledWith("/api/checkout/quote", {
      items: [
        {
          productDocumentId: "product-a",
          variantDocumentId: "variant-a",
          quantity: 2,
        },
      ],
    })
  );
  expect(await screen.findByRole("cell", { name: "₹210.00" })).toBeInTheDocument();
  expect(screen.getByRole("cell", { name: "-₹21.00" })).toBeInTheDocument();
  expect(screen.getByRole("cell", { name: "₹189.00" })).toBeInTheDocument();
  const summary = screen.getByRole("region", { name: "Order Summary" });
  expect(within(summary).getByText("₹180.00")).toBeInTheDocument();
  expect(within(summary).getByText("₹9.00")).toBeInTheDocument();
});

test("renders multiple-product aggregates and does not claim one GST rate", async () => {
  apiClient.post.mockImplementation(() => response(multipleQuote));
  renderCart([
    cartItem(),
    cartItem({
      productDocumentId: "product-b",
      variantDocumentId: "variant-b",
      productName: "cached second product",
    }),
  ]);

  const summary = await screen.findByRole("region", { name: "Order Summary" });
  expect(within(summary).getByText("₹225.00")).toBeInTheDocument();
  expect(within(summary).getByText("-₹20.50")).toBeInTheDocument();
  expect(within(summary).getByText("₹190.00")).toBeInTheDocument();
  expect(within(summary).getByText("GST")).toBeInTheDocument();
  expect(within(summary).queryByText(/GST @/)).toBeNull();
  expect(within(summary).getByText("₹14.50")).toBeInTheDocument();
  expect(within(summary).getByText("₹204.50")).toBeInTheDocument();
});

test("still allows removing a cart line while its quote is unavailable", async () => {
  apiClient.post.mockRejectedValue(new Error("unavailable"));
  renderCart();

  await screen.findByRole("alert");
  fireEvent.click(screen.getByRole("button", { name: "Remove Manipulated browser name" }));
  expect(await screen.findByText("Your cart is empty!")).toBeInTheDocument();
});
