import { useEffect, useState } from "react";
import { fetchDataFromApi } from "../../utils/Api";
import { useNavigate } from "react-router-dom";

const Products = () => {
  const [products, setProducts] = useState([]);
  const [quantities, setQuantities] = useState({}); // {productId: {variantIndex: qty}}
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetchDataFromApi("/api/products?populate=*");
        if (res) setProducts(res.data);
      } catch (err) {
        console.error("❌ Failed to fetch products:", err);
      }
    };
    load();
  }, []);

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

  // Helpers to extract plain text from Strapi rich-text JSON
  const renderIngredients = (ingredients) => {
    return ingredients?.map((block, i) =>
      block.children?.map((c, j) => <p key={i + "-" + j}>{c.text}</p>)
    );
  };

  const renderHowToPrepare = (steps) => {
    return steps?.map((block, i) => (
      <ul key={i}>
        {block.children?.map((li, j) => (
          <li key={j}>{li.children?.[0]?.text}</li>
        ))}
      </ul>
    ));
  };

  // Move to checkout with selected items
  const handleProceed = (product) => {
    const selected = quantities[product.id];
    if (!selected || Object.values(selected).every((q) => q === 0)) {
      alert("Please select at least one quantity before proceeding.");
      return;
    }

    // Prepare cart details
    const cartData = {
      productId: product.id,
      title: product.Title,
      variants: product.Variants.map((v, idx) => ({
        size: v.size,
        price: v.price,
        qty: selected[idx] || 0,
      })).filter((v) => v.qty > 0),
    };

    // Save in localStorage and redirect
    localStorage.setItem("cart", JSON.stringify(cartData));
    navigate("/checkout");
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
              </div>
            ))}

            {/* Proceed button */}
            <button onClick={() => handleProceed(product)}>
              Proceed to pay
            </button>

{/* / Products.jsx (snippet) */}
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
    </div>
  );
};

export default Products;
