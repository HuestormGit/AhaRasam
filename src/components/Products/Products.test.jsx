import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Products from "./Products";
import { CartProvider } from "../../context/CartContext";
import { fetchDataFromApi } from "../../utils/Api";

jest.mock("../../utils/Api", () => ({
  fetchDataFromApi: jest.fn(),
  mediaUrl: (url) => url,
}));

// Trimmed copy of a real Strapi 5 response from the updated backend: variants
// are a populated relation with paise pricing, not the old `Variant` JSON.
const RESPONSE = {
  data: [
    {
      id: 8,
      documentId: "ckm66wbv3hzkhyxhgvzuyqbi",
      Title: "Classic",
      SubTitle: "Authentic rasam, timeless flavor!",
      Ingredients: [
        { type: "paragraph", children: [{ text: "Toor Daal, Dhaniya, Jeera.", type: "text" }] },
      ],
      Image: null,
      variants: [
        {
          id: 7,
          documentId: "jseeue4rhm99exlb9ms1gqrr",
          name: "Rasam Powder 100g",
          sku: "AHA-CLASSIC-100",
          packSize: "100gms",
          // No discount: the card's MRP and the cart's price are the same ₹105.
          mrpMinor: 10500,
          sellingPriceMinor: 10500,
          isActive: true,
          displayOrder: 1,
        },
        {
          id: 8,
          documentId: "qnm9g6bzzmqd4jx7shdl5bla",
          name: "Rasam Powder 250g",
          sku: "AHA-CLASSIC-250",
          packSize: "250gms",
          // Discounted: the card shows MRP ₹240, the cart is charged ₹228.
          mrpMinor: 24000,
          sellingPriceMinor: 22800,
          isActive: true,
          displayOrder: 2,
        },
      ],
    },
  ],
};

const renderProducts = () =>
  render(
    <CartProvider>
      <Products />
    </CartProvider>
  );

// Both the mobile slider and the desktop grid render every product.
const firstSelect = () => screen.getAllByRole("combobox")[0];
const storedCart = () => JSON.parse(localStorage.getItem("cartList") || "[]");

beforeEach(() => {
  localStorage.clear();
  jest.spyOn(window, "alert").mockImplementation(() => {});
  fetchDataFromApi.mockResolvedValue(RESPONSE);
});

afterEach(() => jest.restoreAllMocks());

test("populates the variants relation instead of everything", async () => {
  renderProducts();
  await waitFor(() => expect(fetchDataFromApi).toHaveBeenCalled());

  const url = fetchDataFromApi.mock.calls[0][0];
  expect(url).toContain("populate[variants]");
  expect(url).toContain("populate[variants][filters][isActive][$eq]=true");
  expect(url).not.toContain("populate=*");
});

test("renders the product with its variants and paise pricing as rupees", async () => {
  renderProducts();

  expect(await screen.findAllByText("Classic")).not.toHaveLength(0);
  expect(screen.getAllByText("MRP: ₹105")).not.toHaveLength(0);
  expect(screen.getAllByRole("option", { name: "100gms" })).not.toHaveLength(0);
  expect(screen.getAllByRole("option", { name: "250gms" })).not.toHaveLength(0);
});

test("selecting another variant switches the displayed price", async () => {
  renderProducts();
  await screen.findAllByText("Classic");

  await userEvent.selectOptions(firstSelect(), "1");

  expect(screen.getAllByText("MRP: ₹240")).not.toHaveLength(0);
});

test("adds the selected variant to the cart and persists it", async () => {
  renderProducts();
  await screen.findAllByText("Classic");

  await userEvent.selectOptions(firstSelect(), "1");
  await userEvent.click(screen.getAllByRole("button", { name: "+" })[0]);
  await userEvent.click(screen.getAllByRole("button", { name: "+" })[0]);
  await userEvent.click(screen.getAllByRole("button", { name: /add to cart/i })[0]);

  await waitFor(() => expect(storedCart()).toHaveLength(1));
  // The cart carries the selling price, not the MRP shown on the card.
  expect(storedCart()[0]).toEqual({
    productDocumentId: "ckm66wbv3hzkhyxhgvzuyqbi",
    variantDocumentId: "qnm9g6bzzmqd4jx7shdl5bla",
    productId: 8,
    productName: "Classic",
    variantId: 8,
    sku: "AHA-CLASSIC-250",
    size: "250gms",
    price: 228,
    qty: 2,
  });
});

test("a product whose variants are missing renders without crashing", async () => {
  fetchDataFromApi.mockResolvedValue({
    data: [{ id: 9, Title: "No variants yet", SubTitle: "", Ingredients: null, Image: null }],
  });
  renderProducts();

  expect(await screen.findAllByText("No variants yet")).not.toHaveLength(0);
  expect(screen.getAllByText("MRP: ₹—")).not.toHaveLength(0);
  expect(screen.getAllByText("Currently unavailable")).not.toHaveLength(0);
  expect(screen.queryByRole("combobox")).toBeNull();
  expect(screen.queryByRole("button", { name: /add to cart/i })).toBeNull();
});

test("survives an empty or failed products response", async () => {
  fetchDataFromApi.mockResolvedValue(null);
  renderProducts();

  expect(await screen.findByText("Buy AHA! Rasam")).toBeInTheDocument();
});
