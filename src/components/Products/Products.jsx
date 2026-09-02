import { useEffect, useState, useContext, useRef } from "react";
import { fetchDataFromApi, mediaUrl } from "../../utils/Api";
import { formatAmount, minorToRupees } from "../../utils/money";
import "./Products.scss";
import { CartContext } from "../../context/CartContext";

const Products = () => {
  const [products, setProducts] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [selectedVariantIndex, setSelectedVariantIndex] = useState({});
  const { addToCart } = useContext(CartContext);
  const sliderRef = useRef(null);

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

  // useEffect(() => {
  //   const slider = sliderRef.current;
  //   if (!slider) return;

  //   let index = 0;

  //   const interval = setInterval(() => {
  //     if (!slider.children.length) return;

  //     const cards = slider.children;
  //     const cardWidth = cards[0].offsetWidth + 15;

  //     index++;

  //     if (index >= cards.length) {
  //       index = 0;
  //       slider.scrollTo({ left: 0, behavior: "smooth" });
  //       return;
  //     }

  //     slider.scrollTo({
  //       left: index * cardWidth,
  //       behavior: "smooth",
  //     });
  //   }, 5000);

  //   return () => clearInterval(interval);
  // }, [products]);

  const handleQtyChange = (productId, delta) => {
    setQuantities((prev) => {
      const current = prev[productId] || 0;
      return { ...prev, [productId]: Math.max(current + delta, 0) };
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
    const qty = quantities[productId] || 0;

    if (qty === 0) {
      alert("Please select quantity before adding to cart.");
      return;
    }

    const variants = getVariants(product);
    const vIndex = selectedVariantIndex[productId] ?? 0;
    const variant = variants[vIndex];

    if (!variant) return;

    addToCart({
      productId,
      productName: product.Title,
      // variantId/sku identify the sellable entity the order will be built from;
      // size/price keep the existing cart + UI fields (rupees) unchanged.
      variantId: variant.id,
      sku: variant.sku,
      size: variantLabel(variant),
      price: variantPrice(variant),
      qty,
    });

    alert(`${qty} item(s) added to cart`);
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

          {/* MOBILE SLIDER */}
          <div className="mobile-slider">
            <div className="slides-wrapper" ref={sliderRef}>
              {products.map((product) => {
                const productId = product.id;
                const image =
                  mediaUrl(product.Image?.url) ||
                  "https://placehold.co/300x300?text=No+Image";

                const variants = getVariants(product);
                const selectedIdx = selectedVariantIndex[productId] ?? 0;
                const qty = quantities[productId] || 0;

                const ingredientsText = extractText(product.Ingredients);

                return (
                  <div key={productId} className="product-card">
                    <div className="product-thumb">
                      <img src={image} alt={product.Title} />
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
                              onClick={() =>
                                handleQtyChange(productId, -1)
                              }
                              className="qty-btn"
                            >
                              -
                            </button>

                            <span>{qty}</span>

                            <button
                              onClick={() =>
                                handleQtyChange(productId, 1)
                              }
                              className="qty-btn"
                            >
                              +
                            </button>
                          </div>

                          <button
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

          {/* DESKTOP GRID */}
          <div className="products-grid">
            {products.map((product) => {
              const productId = product.id;

              const image =
                mediaUrl(product.Image?.url) ||
                "https://placehold.co/300x300?text=No+Image";

              const variants = getVariants(product);
              const selectedIdx = selectedVariantIndex[productId] ?? 0;
              const qty = quantities[productId] || 0;

              const ingredientsText = extractText(product.Ingredients);

              return (
                <div key={productId} className="product-card">
                  <div className="product-thumb">
                    <img src={image} alt={product.Title} />
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
                            onClick={() =>
                              handleQtyChange(productId, -1)
                            }
                            className="qty-btn"
                          >
                            -
                          </button>

                          <span>{qty}</span>

                          <button
                            onClick={() =>
                              handleQtyChange(productId, 1)
                            }
                            className="qty-btn"
                          >
                            +
                          </button>
                        </div>

                        <button
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
    </div>
  );
};

export default Products;