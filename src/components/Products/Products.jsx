import { useEffect, useState, useContext } from "react";
import { fetchDataFromApi } from "../../utils/Api";
import "./Products.scss";
import { CartContext } from "../../context/CartContext";

const Products = () => {
  const [products, setProducts] = useState([]);
  const [quantities, setQuantities] = useState({});
  const { addToCart } = useContext(CartContext);

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

  const handleAddToCart = (productId, product) => {
    const selected = quantities[productId];
    if (!selected || Object.values(selected).every((q) => q === 0)) {
      alert("Please select at least one quantity before adding to cart.");
      return;
    }

    product.Variant.forEach((v, idx) => {
      const qty = selected[idx] || 0;
      if (qty > 0) {
        addToCart({
          productId: productId,
          productName: product.Title,
          size: v.size,
          price: v.price,
          qty,
        });
      }
    });

    alert("Items added to cart!");
  };

  if (!products || products.length === 0)
    return <p className="text-center mt-5">No products available.</p>;

  return (
    <div className="products-grid container">
      <h2>Products</h2>

      <div className="products-container d-flex justify-content-center ">
        {products.map((product) => {
          // ✅ Image (full URL already in Strapi response)
          const imgUrl = product.Image?.url || "https://placehold.co/300";

          return (
            <div key={product.id} className="product-card col-sm-12 col-md-4">
              <h3>{product.Title}</h3>

              {/* ✅ Display product image */}
              <img src={imgUrl} alt={product.Title} width="300" />

              {/* ✅ Variants Section */}
              {product.Variant?.map((v, idx) => (
                <div key={idx} className="variant-row">
                  <span>
                    {v.size} 
                  </span>
                  {/* with price 
                  <span>
                    {v.size} – ₹{v.price}
                  </span> */}
                  <div className="d-flex">
                    <button className="trash-btn">🗑</button>
                    <div className="varqty-sec">
                      <button
                        className="qty-btn"
                        onClick={() => handleQtyChange(product.id, idx, -1)}
                      >
                        -
                      </button>
                      <span className="qty-value">
                        {quantities[product.id]?.[idx] || 0}
                      </span>
                      <button
                        className="qty-btn"
                        onClick={() => handleQtyChange(product.id, idx, 1)}
                      >
                        +
                      </button>
                    </div>
                  </div>
                  
                </div>
              ))}
              
              <div className="process-ctn-cls">
              <button
                className="proceed-btn"
                onClick={() => handleAddToCart(product.id, product)}
              >
                Proceed to Pay
              </button>
              </div>
              <hr></hr>

              {/* ✅ Ingredients Section */}
              {product.Ingredients?.length > 0 && (
                <div className="ingredients text-start">
                  <h4>Ingredients</h4>
                  {product.Ingredients.map((block, i) =>
                    block.children?.map((c, j) => (
                      <p key={i + "-" + j}>{c.text}</p>
                    ))
                  )}
                </div>
              )}

              {/* ✅ Preparation Steps Section */}
              {product.HOWTOPREPAREAHARASAM?.length > 0 && (
                <div className="howto text-start">
                  <h4>How to Prepare</h4>
                  {product.HOWTOPREPAREAHARASAM.map((block, i) => (
                    <ul key={i}>
                      {block.children?.map((li, j) => (
                        <li key={j}>{li.children?.[0]?.text}</li>
                      ))}
                    </ul>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Products;
