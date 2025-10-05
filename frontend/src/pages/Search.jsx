import React, { useEffect, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

// Dynamically detect backend base URL
const API =
  process.env.REACT_APP_API_URL ||
  (window.location.hostname === "localhost"
    ? "http://localhost:5000"
    : "https://ts-anime-backend.onrender.com");

function getImageUrl(filename) {
  if (!filename) return "/placeholder.png";

  // Handles Render deployment correctly
  if (filename.startsWith("http")) return filename;
  return `${API}${filename.startsWith("/uploads/") ? filename : `/uploads/${filename}`}`;
}

export default function Search({ addToCart, user, siteDiscount }) {
  const navigate = useNavigate();
  const location = useLocation();
  const keyword = new URLSearchParams(location.search).get("keyword") || "";

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch products based on keyword
  useEffect(() => {
    if (!keyword) return;
    setLoading(true);

    axios
      .get(`${API}/api/products?keyword=${encodeURIComponent(keyword)}`)
      .then((res) => {
        setProducts(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching products:", err);
        setLoading(false);
      });
  }, [keyword]);

  // Handle button action (Add or View)
  const handleAction = (product) => {
    if (product.hasOptions || (product.options && product.options.length > 0)) {
      navigate(`/product/${product.productID}`);
    } else {
      const newItem = {
        id: product.productID,
        name: product.productTitle,
        price: parseFloat(product.listPrice) || 0,
        qty: 1,
        stock: product.stock || 10,
        pic: product.productImage,
        optionKey: "default",
      };
      addToCart(newItem);
    }
  };

  return (
    <div className="container py-5">
      <h2 className="mb-4">
        Search Results for: <span className="text-primary">{keyword}</span>
      </h2>

      {loading && <p>Loading...</p>}
      {!loading && products.length === 0 && <p>No products found.</p>}

      <div className="row">
        {products.map((product) => (
          <div key={product.productID} className="col-md-3 mb-4">
            <div className="card h-100 text-center">
              <img
                src={getImageUrl(product.productImage)}
                alt={product.productTitle}
                className="card-img-top"
                style={{ height: "200px", objectFit: "cover" }}
                onError={(e) => (e.target.src = "/placeholder.png")}
              />
              <div className="card-body">
                <h5>{product.productTitle}</h5>
                <p>
                  <span className="text-danger">
                    ${(product.listPrice * (1 - siteDiscount / 100)).toFixed(2)}
                  </span>{" "}
                  <del>${product.listPrice}</del>
                </p>
                <button
                  className={`btn ${
                    product.hasOptions || (product.options && product.options.length > 0)
                      ? "btn-outline-primary"
                      : "btn-primary"
                  }`}
                  onClick={() => handleAction(product)}
                >
                  {product.hasOptions || (product.options && product.options.length > 0)
                    ? "View Product"
                    : "Add to Cart"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
