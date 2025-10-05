import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { FaInfoCircle } from "react-icons/fa";

import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

// 🌍 Use backend URL from env variable (works on Vercel + local)
const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

// ✅ Unified image path helper
function getImageUrl(filename) {
  if (!filename || typeof filename !== "string" || filename.trim() === "") {
    return "/images/placeholder.png";
  }
  if (filename.startsWith("http")) return filename;

  if (filename.startsWith("/uploads/")) {
    return `${API_BASE}${filename}`;
  }

  if (filename.startsWith("/api/uploads/")) {
    return `${API_BASE}${filename.replace("/api", "")}`;
  }

  return `${API_BASE}/uploads/${filename}`;
}

export default function Category({ addToCart, siteDiscount = 30 }) {
  const { id } = useParams();
  const [products, setProducts] = useState([]);
  const [categoryName, setCategoryName] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;

    setLoading(true);
    axios
      .get(`${API_BASE}/api/products/category/${id}`)
      .then((res) => {
        setProducts(res.data);
        if (res.data.length > 0) {
          setCategoryName(res.data[0].categoryName);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching category products:", err);
        setLoading(false);
      });
  }, [id]);

  const handleAddToCart = (product) => {
    const cartItem = {
      id: product.productID,
      name: product.productTitle,
      price: parseFloat(product.listPrice) || 0,
      qty: 1,
      stock: product.stock || 10,
      pic: product.productImage,
      optionKey: "default",
    };
    addToCart(cartItem);
  };

  const goToProduct = (id) => navigate(`/product/${id}`);

  if (loading) {
    return <p className="text-center mt-5">Loading products...</p>;
  }

  return (
    <div className="container py-5">
      <h2 className="mb-4 text-center">
        {categoryName ? `Category: ${categoryName}` : "Category"}
      </h2>

      {products.length === 0 ? (
        <p className="text-center text-muted">
          No products found in this category.
        </p>
      ) : (
        <div className="row">
          {products.map((product) => (
            <div key={product.productID} className="col-md-4 mb-4">
              <div className="card h-100 product-card text-center">
                <div className="position-relative">
                  <img
                    src={getImageUrl(product.productImage)}
                    alt={product.productTitle}
                    className="card-img-top"
                    style={{ height: "250px", objectFit: "cover" }}
                    onError={(e) =>
                      (e.currentTarget.src = "/images/placeholder.png")
                    }
                  />
                  <FaInfoCircle
                    className="position-absolute top-0 end-0 m-2 text-primary"
                    title="View Product"
                    onClick={() => goToProduct(product.productID)}
                    style={{ cursor: "pointer", fontSize: "1.5rem" }}
                  />
                </div>
                <div className="card-body">
                  <h5>{product.productTitle}</h5>
                  <p>
                    <span className="text-danger">
                      $
                      {(
                        product.listPrice *
                        (1 - siteDiscount / 100)
                      ).toFixed(2)}
                    </span>{" "}
                    <del>${product.listPrice}</del>
                  </p>

                  <button
                    className="btn btn-primary"
                    onClick={() => handleAddToCart(product)}
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
