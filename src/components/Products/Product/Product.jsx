import { useParams } from "react-router-dom";
import { useEffect, useState, useContext } from "react";
import { fetchDataFromApi } from "../utils/Api";
import { Context } from "../utils/Context";

const Product = () => {
  const { id } = useParams();
  const { addToCart } = useContext(Context);
  const [product, setProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);

  useEffect(() => {
    const getProduct = async () => {
      const res = await fetchDataFromApi(
        `/products/${id}?populate=variants,image`
      );
      if (res) {
        setProduct(res.data);
      }
    };
    getProduct();
  }, [id]);

  if (!product) return <p>Loading...</p>;

  const p = product.attributes;

  return (
    <div className="product">
      <h2 className="heading">{p.title}</h2>
      <img
        src={p.image?.data?.attributes?.url}
        alt={p.title}
        width="300"
      />
      <div>
        <label>Choose Variant:</label>
        <select
          value={selectedVariant?.id || ""}
          onChange={(e) =>
            setSelectedVariant(
              p.variants.find((v) => v.id === parseInt(e.target.value))
            )
          }
        >
          <option value="">-- Select --</option>
          {p.variants?.map((v) => (
            <option key={v.id} value={v.id}>
              {v.size} – ₹{v.price}
            </option>
          ))}
        </select>
      </div>

      <button
        onClick={() => {
          if (selectedVariant) {
            addToCart(product, selectedVariant);
          } else {
            alert("Please select a variant first");
          }
        }}
      >
        Add to Cart
      </button>

      <div className="ingredients">
        <h3>Ingredients</h3>
        <p>{p.ingredients}</p>
      </div>

      <div className="how-to">
        <h3>How to Make</h3>
        <p>{p.howToMake}</p>
      </div>
    </div>
  );
};

export default Product;
