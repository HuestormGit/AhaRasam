import { useEffect, useState, useContext } from "react";
import { fetchDataFromApi } from "../../utils/Api";
import "./Products.scss";
import { CartContext } from "../../context/CartContext";

const Products = () => {
  const [products, setProducts] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [selectedVariantIndex, setSelectedVariantIndex] = useState({});
  const { addToCart } = useContext(CartContext);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const res = await fetchDataFromApi(
          "/api/products?populate=*"
          // "/api/products?populate=*&sort=id:asc"
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
        <h2>Buy Aha! Rasam</h2>

        <div className="sub-heading d-flex justify-content-center">
          <p>
            Experience Rasam, Rooted in Tradition.
            <br /> Delight all your senses with Rasam from the roots. Taste the
            tradition today!
          </p>
        </div>

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
            const howToPrepareText = extractText(product.HOWTOPREPAREAHARASAM);

            return (
              <div key={productId} className="product-card">
                <div className="product-thumb">
                <img src={image} alt={product.Title} />
                </div>
                <div className="product-details">

                <h3 className="title">{product.Title}</h3>

                {/* INGREDIENTS */}
                <h4 className="sub-title">Ingredients:</h4>
                <p className="desc">
                  {ingredientsText || "No ingredients available"}
                </p>

                {/* HOW TO PREPARE */}
                {/* <h4 className="sub-title">How To Prepare:</h4>
                <p className="desc">
                  {howToPrepareText || "No preparation steps available"}
                </p> */}

                {/* Dynamic Price */}
                <p className="mrp">MRP: ₹{variants[selectedIdx]?.price || "—"}</p>

                {/* Variant */}
                {variants.length > 0 && (
                  <select
                    className="variant-drop"
                    value={selectedIdx}
                    onChange={(e) =>
                      handleVariantChange(productId, Number(e.target.value))
                    }
                  >
                    {variants.map((v, idx) => (
                      <option value={idx} key={idx}>
                        {v.size}
                      </option>
                    ))}
                  </select>
                )}

                {/* Qty */}
                <div className="qty-box">
                  <button onClick={() => handleQtyChange(productId, -1)}>-</button>
                  <span>{qty}</span>
                  <button onClick={() => handleQtyChange(productId, 1)}>+</button>
                </div>
                </div>

                {/* Add to cart */}
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
      {/* Sticky Bottom Checkout */}
        <div className="sticky-proceed">
          <button className="proceed-btn">
            {totalItems > 0
              ? `${totalItems} products added — Proceed to Pay`
              : `Proceed to Pay`}
          </button>
        </div>
    </div>
  );
};

export default Products;
