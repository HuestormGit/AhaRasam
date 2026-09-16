import { useEffect, useState, useContext } from "react";
import { fetchDataFromApi, mediaUrl } from "../../utils/Api";
import { formatAmount, minorToRupees } from "../../utils/money";
import "./Products.scss";
import { CartContext } from "../../context/CartContext";
import Modal from "../Modal/Modal";

// Every thumbnail is rendered in the same square box. Declaring that size on the
// element itself gives the image an intrinsic aspect ratio, so the card reserves
// its space before the bytes arrive instead of reflowing when they land.
const THUMB_SIZE = 220;

const Products = () => {
  const [products, setProducts] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [selectedVariantIndex, setSelectedVariantIndex] = useState({});
  const { addToCart } = useContext(CartContext);
  // Quantity of the last successful add; null means the modal is closed.
  const [addedQty, setAddedQty] = useState(null);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        // Variants are their own collection now, so the relation has to be
        // populated explicitly: only the active ones, in their display order.
        const res = await fetchDataFromApi(
          "/api/products?populate[Image]=true" +
            "&populate[variants][filters][isActive][$eq]=true" +
            "&populate[variants][sort][0]=displayOrder:asc" +
            "&sort=id:asc&status=published"
        );

        if (res?.data?.length > 0) {
          // const filteredProducts = res.data.filter((p) => p.id !== 73);
          // setProducts(filteredProducts);
          setProducts(res.data);
        }
      } catch (err) {
        console.error("Failed to fetch products:", err);
      }
    };

    loadProducts();
  }, []);

  const handleQtyChange = (productId, delta) => {
    setQuantities((prev) => {
      const current = prev[productId] || 1;
      return { ...prev, [productId]: Math.max(current + delta, 1) };
    });
  };

  const handleVariantChange = (productId, index) => {
    setSelectedVariantIndex((prev) => ({
      ...prev,
      [productId]: index,
    }));
  };

  // Strapi 5 returns the relation flat (product.variants); the v4-style
  // { data: [{ id, attributes }] } envelope is unwrapped too so a response from
  // either version renders the same cards.
  const getVariants = (product) => {
    const raw = product?.variants;
    const list = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
    return list.map((v) => ({ id: v.id, ...(v.attributes || v) }));
  };

  // The old Variant JSON carried `size` and a rupee `price`; a Product Variant
  // carries packSize/name and integer paise.
  const variantLabel = (v) => v?.packSize || v?.name || "";
  // The card's line is labelled MRP, so it shows mrpMinor; the cart is charged
  // sellingPriceMinor. They are the same whenever discountMinor is 0.
  const variantMrp = (v) => minorToRupees(v?.mrpMinor ?? v?.sellingPriceMinor);
  const variantPrice = (v) => minorToRupees(v?.sellingPriceMinor);

  const extractText = (blocks) => {
    if (!Array.isArray(blocks)) return "";
    return blocks
      .map((b) =>
        Array.isArray(b.children)
          ? b.children.map((c) => c.text).join(" ")
          : ""
      )
      .join(" ");
  };

  const handleAddToCart = (productId, product) => {
    const qty = quantities[productId] || 1;

    if (qty === 0) {
      alert("Please select quantity before adding to cart.");
      return;
    }

    const variants = getVariants(product);
    const vIndex = selectedVariantIndex[productId] ?? 0;
    const variant = variants[vIndex];

    if (!variant) return;

    addToCart({
      productDocumentId: product.documentId,
      variantDocumentId: variant.documentId,
      productId,
      productName: product.Title,
      // Numeric IDs and display snapshots are convenient for the current UI;
      // checkout identity and authority come from the document IDs above.
      variantId: variant.id,
      sku: variant.sku,
      size: variantLabel(variant),
      price: variantPrice(variant),
      qty,
    });

    setAddedQty(qty);
  };

  return (
    <div className="container-fluid product-section" id="product">
      <div className="products-wrapper container">
        <div className="row">
          <div className="col-12">
            <h2>Buy AHA! Rasam</h2>
          </div>

          <div className="col-12 d-flex justify-content-center">
            <div className="sub-heading">
              <p>Experience rasam rooted in tradition.</p>
              <p>
                A sensory journey crafted from age-old recipes. Taste true
                tradition.
              </p>
            </div>
          </div>

          {/* One card per product, once. This list is a horizontal scroll strip
              on phones and a grid from md up — the difference is layout only, so
              there is no second copy of the cards to keep in sync, hide, or
              make the browser decode twice. */}
          <div className="products-list">
            {products.map((product) => {
              const productId = product.id;
              const image =
                mediaUrl(product.Image?.url) ||
                "https://placehold.co/300x300?text=No+Image";

              const variants = getVariants(product);
              const selectedIdx = selectedVariantIndex[productId] ?? 0;
              const qty = quantities[productId] || 1;

              const ingredientsText = extractText(product.Ingredients);

              return (
                <div key={productId} className="product-card">
                  <div className="product-thumb">
                    <img
                      src={image}
                      alt={product.Title}
                      width={THUMB_SIZE}
                      height={THUMB_SIZE}
                      // The section sits below a full-height banner at every
                      // supported width, so no product image is ever the LCP
                      // element and none of them need to block the first paint.
                      loading="lazy"
                      decoding="async"
                    />
                  </div>

                  <div className="product-details">
                    <h3 className="title">{product.Title}</h3>
                    <h4 className="sub-title">{product.SubTitle}</h4>

                    <h5 className="Ingredients">Ingredients:</h5>
                    <p className="desc">
                      {ingredientsText || "No ingredients available"}
                    </p>

                    <p className="mrp">
                      MRP: ₹
                      {variants[selectedIdx]
                        ? formatAmount(variantMrp(variants[selectedIdx]))
                        : "—"}
                    </p>

                    {variants.length === 0 && (
                      <p className="variant-unavailable">Currently unavailable</p>
                    )}

                    {variants.length > 0 && (
                      <>
                        <select
                          className="variant-drop"
                          // The control shows only the pack size, so on its own
                          // it is an unlabelled combobox to a screen reader.
                          aria-label={`Pack size${
                            product.Title ? ` for ${product.Title}` : ""
                          }`}
                          value={selectedIdx}
                          onChange={(e) =>
                            handleVariantChange(
                              productId,
                              Number(e.target.value)
                            )
                          }
                        >
                          {variants.map((v, idx) => (
                            <option value={idx} key={idx}>
                              {variantLabel(v)}
                            </option>
                          ))}
                        </select>

                        <div className="qty-box">
                          <button
                            type="button"
                            onClick={() =>
                              handleQtyChange(productId, -1)
                            }
                            className="qty-btn"
                          >
                            -
                          </button>

                          <span>{qty}</span>

                          <button
                            type="button"
                            onClick={() =>
                              handleQtyChange(productId, 1)
                            }
                            className="qty-btn"
                          >
                            +
                          </button>
                        </div>

                        <button
                          type="button"
                          className="add-btn"
                          onClick={() =>
                            handleAddToCart(productId, product)
                          }
                        >
                          ADD TO CART
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <Modal
        show={addedQty !== null}
        success
        title="Added to cart"
        message={`${addedQty} item${addedQty === 1 ? "" : "s"} added to your cart`}
        onClose={() => setAddedQty(null)}
      />
    </div>
  );
};

export default Products;
