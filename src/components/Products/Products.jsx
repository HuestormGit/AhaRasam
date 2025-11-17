import { useEffect, useState, useContext } from "react";
import { fetchDataFromApi } from "../../utils/Api";
import "./Products.scss";
import { CartContext } from "../../context/CartContext";
import trash from "../../assets/trash.png";

const Products = () => {
  const [products, setProducts] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { addToCart } = useContext(CartContext);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const res = await fetchDataFromApi("/api/products?populate=*&sort=id:asc");
        if (res?.data?.length > 0) {
          setProducts(res.data);
        }
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

  const totalItems = Object.values(quantities)
    .flatMap((v) => Object.values(v))
    .reduce((a, b) => a + b, 0);

  if (!products || products.length === 0)
    return (
      <div className="products-wrapper container text-center">
        <h2>Buy Aha! Rasam</h2>
        <p>
          Experience Rasam, Rooted in Tradition. <br />
          Delight all your senses with Rasam from the roots. Taste the
          tradition today!
        </p>
        <div className="sticky-proceed">
          <button className="proceed-btn">
            Proceed to Pay {totalItems > 0 && `(${totalItems} added)`}
          </button>
        </div>
      </div>
    );

  const selectedProduct = products[selectedIndex];
  const imgUrl = selectedProduct.Image?.url || "https://placehold.co/300";

  return (
    <div className="products-wrapper container">
      <h2>Buy Aha! Rasam</h2>
      <div className="sub-heading d-flex justify-content-center">
        <p>
          Experience Rasam, Rooted in Tradition.
          <br /> Delight all your senses with Rasam from the roots. Taste the
          tradition today!
        </p>
      </div>
      <div className="products-flex ">

      </div>


      <div className="product-main">
        {/* LEFT: Image */}
        <div className="product-image">
          <img src={imgUrl} alt={selectedProduct.Title} />
        </div>

        {/* CENTER: Product Info */}
        <div className="product-info">
          <h3 className="title">{selectedProduct.Title}</h3>
          <p className="desc">
            {selectedProduct.Description ||
              "Lorem ipsum dolor sit amet, consectetur adipiscing elit."}
          </p>

          <p className="mrp">MRP: ₹{selectedProduct.Variant?.[0]?.price || "—"}</p>

          {selectedProduct.Variant?.length > 0 && (
            <select className="variant-select">
              {selectedProduct.Variant.map((v, idx) => (
                <option key={idx}>{v.size}</option>
              ))}
            </select>
          )}

          <div className="varqty-sec">
            <button
              className="qty-btn"
              onClick={() => handleQtyChange(selectedProduct.id, 0, -1)}
            >
              -
            </button>
            <span className="qty-value">
              {quantities[selectedProduct.id]?.[0] || 0}
            </span>
            <button
              className="qty-btn"
              onClick={() => handleQtyChange(selectedProduct.id, 0, 1)}
            >
              +
            </button>
          </div>

          <button
            className="add-btn"
            onClick={() =>
              handleAddToCart(selectedProduct.id, selectedProduct)
            }
          >
            ADD TO CART
          </button>
        </div>

        {/* RIGHT: Product List */}
        <div className="product-list">
          {products.map((p, idx) => (
            <div
              key={p.id}
              className={`list-item ${
                selectedIndex === idx ? "active" : ""
              }`}
              onClick={() => setSelectedIndex(idx)}
            >
              {p.Title}
            </div>
          ))}
        </div>
      </div>

      {/* Sticky Proceed */}
      <div className="sticky-proceed">
        <button className="proceed-btn">
          Proceed to Pay {totalItems > 0 && `(${totalItems} added)`}
        </button>
      </div>
    </div>
  );
};

export default Products;
