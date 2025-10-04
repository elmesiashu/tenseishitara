import React, { useEffect, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

function getImageUrl(filename) {
  if (!filename) return null;
  return `http://localhost:5000${filename.startsWith("/uploads/") ? filename : `/uploads/${filename}`}`;
}

// Helper to read query string
function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default function Search({ cart, setCart, user, siteDiscount }) {
  const query = useQuery();
  const navigate = useNavigate();
  const keyword = query.get("keyword") || "";
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch products based on keyword
  useEffect(() => {
    if (!keyword) return;
    setLoading(true);
    axios
      .get(`http://localhost:5000/api/products?keyword=${encodeURIComponent(keyword)}`)
      .then((res) => {
        setProducts(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [keyword]);

  const handleAddToCart = (product) => {
    if (!cart) return;

    const index = cart.findIndex((item) => item.productID === product.productID);

    if (index !== -1) {
      const updatedCart = [...cart];
      updatedCart[index].qty += 1;
      setCart(updatedCart);
    } else {
      const newItem = {
        productID: product.productID,
        name: product.productTitle,
        price: product.listPrice,
        qty: 1,
        stock: product.stock || 10,
        pic: product.productImage,
      };
      setCart([...cart, newItem]);
    }
  };

  return (
    <div>
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
      </div>
    </div>
  );
}
