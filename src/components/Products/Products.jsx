import { useEffect, useState, useContext, useRef } from "react";
import { fetchDataFromApi } from "../../utils/Api";
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
        const res = await fetchDataFromApi(
          "/api/products?populate=*&sort=id:asc"
        );

        if (res?.data?.length > 0) {
          setProducts(res.data);
        }
      } catch (err) {
        console.error("❌ Failed to fetch products:", err);
      }
    };

    loadProducts();
  }, []);

  useEffect(() => {
  const slider = sliderRef.current;
  if (!slider) return;

  let index = 0;

  const interval = setInterval(() => {
    if (!slider.children.length) return;

    const cards = slider.children;
    const cardWidth = cards[0].offsetWidth + 15; // card width + gap

    index++;

    // Infinite loop (restart from first)
    if (index >= cards.length) {
      index = 0;
      slider.scrollTo({ left: 0, behavior: "smooth" });
      return;
    }

    slider.scrollTo({
      left: index * cardWidth,
      behavior: "smooth",
    });
  }, 2500); // 2.5 seconds autoplay

  return () => clearInterval(interval);
}, [products]);



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

    const vIndex = selectedVariantIndex[productId] ?? 0;
    const variant = product.Variant[vIndex];

    addToCart({
      productId,
      productName: product.Title,
      size: variant.size,
      price: variant.price,
      qty,
    });

    alert(`${qty} item(s) added to cart`);
  };

  const totalItems = Object.values(quantities).reduce((a, b) => a + b, 0);

  return (
    <div className="container-fluid product-section">
      <div className="products-wrapper container">
        <div className="row">
          <div className="col-12">
            <h2>Buy AHA! Rasam</h2>
          </div>
          <div className="col-12 d-flex justify-content-center">
            <div className="sub-heading">
              <p>
                Experience rasam rooted in tradition.
              </p>
              <p>
                A sensory journey crafted from age-old recipes. Taste true tradition.
              </p>
            </div>
          </div>
          <div className="col-12">
            {/* ---- MOBILE SLIDER ---- */}
            <div className="mobile-slider">
              <div className="slides-wrapper" ref={sliderRef}>
                {products.map((product) => {
                  const productId = product.id;
                  const image =
                    product.Image?.url ||
                    "https://placehold.co/300x300?text=No+Image";

                  const variants = product.Variant || [];
                  const selectedIdx = selectedVariantIndex[productId] ?? 0;
                  const qty = quantities[productId] || 0;

                  const ingredientsText = extractText(product.Ingredients);

                  return (
                    // <div key={productId} className="slide-card">
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
                            MRP: ₹{variants[selectedIdx]?.price || "—"}
                          </p>

                          {variants.length > 0 && (
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
                                  {v.size}
                                </option>
                              ))}
                            </select>
                          )}

                          <div className="qty-box">
                            <button
                              onClick={() => handleQtyChange(productId, -1)}
                              className="qty-btn"
                            >
                              -
                            </button>
                            <span>{qty}</span>
                            <button
                              onClick={() => handleQtyChange(productId, 1)}
                              className="qty-btn"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        <button
                          className="add-btn"
                          onClick={() => handleAddToCart(productId, product)}
                        >
                          ADD TO CART
                        </button>
                      </div>
                    // </div>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="col-12">
            {/* ---- DESKTOP GRID ---- */}
            <div className="products-grid">
              {products.map((item) => {
                const product = item;
                const productId = product.id;

                const image =
                  product.Image?.url ||
                  "https://placehold.co/300x300?text=No+Image";

                const variants = product.Variant || [];
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
                        MRP: ₹{variants[selectedIdx]?.price || "—"}
                      </p>

                      {variants.length > 0 && (
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
                              {v.size}
                            </option>
                          ))}
                        </select>
                      )}

                      <div className="qty-box">
                        <button
                          onClick={() => handleQtyChange(productId, -1)}
                          className="qty-btn"
                        >
                          -
                        </button>
                        <span>{qty}</span>
                        <button
                          onClick={() => handleQtyChange(productId, 1)}
                          className="qty-btn"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <button
                      className="add-btn"
                      onClick={() => handleAddToCart(productId, product)}
                    >
                      ADD TO CART
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>


    
    
  );
};

export default Products;
