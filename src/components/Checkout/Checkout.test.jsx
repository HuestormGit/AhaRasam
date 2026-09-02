import { render, screen, waitFor } from "@testing-library/react";
import Checkout from "./Checkout";
import { CartProvider } from "../../context/CartContext";
import { apiClient } from "../../utils/Api";

jest.mock("../../utils/Api", () => ({
  apiClient: { post: jest.fn() },
}));

jest.mock("../../utils/razorpay", () => ({
  RAZORPAY_KEY: "rzp_test_example",
  razorpayConfigError: () => null,
}));

const cartItem = (overrides = {}) => ({
  productDocumentId: "product-a",
  variantDocumentId: "variant-a",
  productId: 8,
  variantId: 7,
  productName: "Manipulated browser name",
  sku: "BROWSER-SKU",
  size: "browser size",
  price: 0.01,
  qty: 2,
  ...overrides,
});

const quote = ({ quantity = 2, ...overrides } = {}) => ({
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
  ...overrides,
});

const response = (data = quote()) => Promise.resolve({ data: { data } });

const renderCheckout = (cartData = [cartItem()], onClose = jest.fn()) =>
  render(
    <CartProvider>
      <Checkout cartData={cartData} onClose={onClose} />
    </CartProvider>
  );

beforeEach(() => {
  localStorage.clear();
  apiClient.post.mockReset();
});

test("requests a quote with only stable IDs and quantity and displays server money", async () => {
  apiClient.post.mockImplementation(() => response());
  renderCheckout();

  await waitFor(() =>
    expect(apiClient.post).toHaveBeenCalledWith("/api/checkout/quote", {
      items: [
        {
          productDocumentId: "product-a",
          variantDocumentId: "variant-a",
          quantity: 2,
        },
      ],
    })
  );

  expect(await screen.findByText("₹210.00")).toBeInTheDocument();
  expect(screen.getByText("-₹21.00")).toBeInTheDocument();
  expect(screen.getByText("₹180.00")).toBeInTheDocument();
  expect(screen.getByText("GST @ 5%")).toBeInTheDocument();
  expect(screen.getByText("₹9.00")).toBeInTheDocument();
  expect(screen.getAllByText("₹189.00")).toHaveLength(2);
  expect(screen.getByText("Calculated at checkout")).toBeInTheDocument();
  expect(screen.getByText(/Classic \(250gms\).*₹94\.50.*₹189\.00/)).toBeInTheDocument();
  expect(screen.queryByText(/Manipulated browser name/)).toBeNull();
  expect(screen.getByRole("button", { name: "Pay ₹189.00" })).toBeDisabled();
});

test("shows a loading state while the quote is pending", () => {
  apiClient.post.mockReturnValue(new Promise(() => {}));
  renderCheckout();
  expect(screen.getByRole("status")).toHaveTextContent("Calculating your total");
});

test("shows a safe quote error with a path back to the cart", async () => {
  const onClose = jest.fn();
  apiClient.post.mockRejectedValue(new Error("database details must stay hidden"));
  renderCheckout([cartItem()], onClose);

  expect(await screen.findByRole("alert")).toHaveTextContent(
    "We couldn't refresh the latest price details"
  );
  expect(screen.queryByText(/database details/)).toBeNull();
  screen.getByRole("button", { name: "Review cart" }).click();
  expect(onClose).toHaveBeenCalledTimes(1);
});

test("refetches when a quote quantity changes", async () => {
  apiClient.post
    .mockImplementationOnce(() => response())
    .mockImplementationOnce(() => response(quote({ quantity: 3 })));
  const view = renderCheckout();
  expect(await screen.findByRole("button", { name: "Pay ₹189.00" })).toBeInTheDocument();

  view.rerender(
    <CartProvider>
      <Checkout cartData={[cartItem({ qty: 3 })]} onClose={jest.fn()} />
    </CartProvider>
  );

  expect(await screen.findByRole("button", { name: "Pay ₹283.50" })).toBeInTheDocument();
  expect(apiClient.post).toHaveBeenLastCalledWith("/api/checkout/quote", {
    items: [
      {
        productDocumentId: "product-a",
        variantDocumentId: "variant-a",
        quantity: 3,
      },
    ],
  });
});
