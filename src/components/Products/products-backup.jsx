import { useEffect, useState } from "react";
import { fetchDataFromApi } from "../../utils/Api";

const Products = () => {
  const [products, setProducts] = useState([]);
  const [quantities, setQuantities] = useState({}); // {productId: {variantIndex: qty}}

  useEffect(() => {
    const load = async () => {
      const res = await fetchDataFromApi("/api/products");
      if (res) setProducts(res.data);
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
          <li key={j}>{li.children[0].text}</li>
        ))}
      </ul>
    ));
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
            <button
              onClick={() =>
                console.log("Proceed to pay", {
                  product: product.Title,
                  variants: quantities[product.id],
                })
              }
            >
              Proceed to pay
            </button>

            {/* Ingredients */}
            <div className="ingredients">
              <h4>Ingredients</h4>
              {renderIngredients(product.Ingredients)}
            </div>

            {/* How to Prepare */}
            <div className="howto">
              <h4>How to Prepare</h4>
              {renderHowToPrepare(product.HOWTOPREPARE)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Products;
