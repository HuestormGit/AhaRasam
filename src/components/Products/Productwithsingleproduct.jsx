import "./Products.scss";
import { useEffect, useState } from "react";
import { fetchDataFromApi } from "../../utils/Api";
import CheckoutPopup from "../CheckoutPopup"; // We'll create this component
import "./Products.scss"; // optional styling

const Products = () => {
  const [products, setProducts] = useState([]);
  const [quantities, setQuantities] = useState({}); // {productId: {variantIndex: qty}}
  const [showPopup, setShowPopup] = useState(false);
  const [cartData, setCartData] = useState(null);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const res = await fetchDataFromApi("/api/products?populate=*");
        if (res) setProducts(res.data);
      } catch (err) {
        console.error("❌ Failed to fetch products:", err);
      }
    };
    loadProducts();
  }, []);

  // Handle quantity change
  const handleQtyChange = (productId, variantIndex, delta) => {
    setQuantities((prev) => {
      const productQtys = prev[productId] || {};
      const current = productQtys[variantIndex] || 0;
      return {
        ...prev,
        [productId]: {
          ...productQtys,
          [variantIndex]: Math.max(current + delta, 0),
        },
      };
    });
  };

  // Render Ingredients from Strapi rich text
  const renderIngredients = (ingredients) => {
    return ingredients?.map((block, i) =>
      block.children?.map((c, j) => <p key={i + "-" + j}>{c.text}</p>)
    );
  };

  // Render How to Prepare steps
  const renderHowToPrepare = (steps) => {
    return steps?.map((block, i) => (
      <ul key={i}>
        {block.children?.map((li, j) => (
          <li key={j}>{li.children?.[0]?.text}</li>
        ))}
      </ul>
    ));
  };

  // Show popup with selected product details
  const handleProceed = (product) => {
    const selected = quantities[product.id];
    if (!selected || Object.values(selected).every((q) => q === 0)) {
      alert("Please select at least one quantity before proceeding.");
      return;
    }

    // Prepare cart details
    const cartDataObj = {
      productId: product.id,
      title: product.Title,
      variants: product.Variants.map((v, idx) => ({
        size: v.size,
        price: v.price,
        qty: selected[idx] || 0,
      })).filter((v) => v.qty > 0),
    };

    setCartData(cartDataObj);
    setShowPopup(true);
  };

  // Handle Add to Cart (Optional for later use)
  const onAddToCart = (item) => {
    let cart = JSON.parse(localStorage.getItem("cartList")) || [];
    cart.push(item);
    localStorage.setItem("cartList", JSON.stringify(cart));
    alert("Added to cart!");
  };

  return (
    <div className="products-grid">
      <h2>Products</h2>
      <div className="grid">
        {products.map((product) => (
          <div key={product.id} className="product-card">
            {/* Product Title */}
            <h3>{product.Title}</h3>

            {/* Variants */}
            {product.Variants?.map((v, idx) => (
              <div key={idx} className="variant-row">
                <span>
                  {v.size} – ₹{v.price}
                </span>
                <button onClick={() => handleQtyChange(product.id, idx, -1)}>
                  -
                </button>
                <span>{quantities[product.id]?.[idx] || 0}</span>
                <button onClick={() => handleQtyChange(product.id, idx, 1)}>
                  +
                </button>

                {/* Add to Cart Button */}
                <button
                  onClick={() =>
                    onAddToCart({
                      productName: product.Title,
                      variant: v.size,
                      quantity: quantities[product.id]?.[idx] || 1,
                      price: v.price,
                    })
                  }
                >
                  Add to Cart
                </button>
              </div>
            ))}

            {/* Proceed button */}
            <button onClick={() => handleProceed(product)}>
              Proceed to Pay
            </button>

            {/* Ingredients */}
            {product.Ingredients?.length > 0 && (
              <div className="ingredients">
                <h4>Ingredients</h4>
                {renderIngredients(product.Ingredients)}
              </div>
            )}

            {/* How to Prepare */}
            {product.HOWTOPREPARE?.length > 0 && (
              <div className="howto">
                <h4>How to Prepare</h4>
                {renderHowToPrepare(product.HOWTOPREPARE)}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Checkout Popup */}
      {showPopup && (
        <CheckoutPopup cartData={cartData} onClose={() => setShowPopup(false)} />
      )}
    </div>
  );
};

export default Products;
