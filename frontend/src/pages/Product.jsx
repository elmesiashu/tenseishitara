import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

// Backend URL
const API_BASE =
  process.env.REACT_APP_API_URL ||
  (window.location.hostname === "localhost"
    ? "http://localhost:5000"
    : "https://ts-anime-backend.onrender.com");

export default function Product({ addToCart, siteDiscount }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [categoryName, setCategoryName] = useState("");
  const [options, setOptions] = useState({});
  const [selectedImage, setSelectedImage] = useState("");
  const [imageFade, setImageFade] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [selectedPreview, setSelectedPreview] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [addedMessage, setAddedMessage] = useState("");

  const [discount, setDiscount] = useState(() => {
    const stored = sessionStorage.getItem("siteDiscount");
    return siteDiscount ?? (stored ? parseInt(stored) : 0);
  });

  // Keep site discount synced
  useEffect(() => {
    if (siteDiscount && siteDiscount !== discount) {
      setDiscount(siteDiscount);
      sessionStorage.setItem("siteDiscount", siteDiscount);
    }
  }, [siteDiscount]);

  // Fetch product data
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/products/${id}`);
        if (!res.ok) throw new Error("Failed to fetch product");
        const data = await res.json();

        const productData = data.product || data;
        const optionData = data.options || [];

        // Group options
        const grouped = optionData.reduce((acc, opt) => {
          if (!acc[opt.optionName]) acc[opt.optionName] = [];
          acc[opt.optionName].push(opt);
          return acc;
        }, {});

        // Add image URLs
        const fixedOptions = {};
        Object.keys(grouped).forEach((key) => {
          fixedOptions[key] = grouped[key].map((opt) => ({
            ...opt,
            preview: opt.preview
              ? `${API_BASE}${opt.preview.startsWith("/") ? opt.preview : `/${opt.preview}`}`
              : "/placeholder.png",
          }));
        });

        setProduct(productData);
        setOptions(fixedOptions);
        setCategoryName(productData.categoryName || "Unknown Category");

        setSelectedImage(
          productData.productImage
            ? `${API_BASE}${productData.productImage.startsWith("/") ? productData.productImage : `/${productData.productImage}`}`
            : "/placeholder.png"
        );

        setLoading(false);
      } catch (err) {
        console.error("Error fetching product:", err);
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  if (loading) return <div className="loading">Loading...</div>;
  if (!product) return <div className="error">Product not found</div>;

  // Handle option change
  const handleOptionChange = (optionName, optionValue, preview, isDefault = false) => {
    if (isDefault) {
      setSelectedOptions((prev) => {
        const updated = { ...prev };
        delete updated[optionName];
        return updated;
      });
      setSelectedPreview(null);
      setImageFade(true);
      setTimeout(() => {
        setSelectedImage(`${API_BASE}${product.productImage}`);
        setImageFade(false);
      }, 200);
      return;
    }

    setSelectedOptions((prev) => ({ ...prev, [optionName]: optionValue }));
    setSelectedPreview(preview);

    if (preview) {
      setImageFade(true);
      setTimeout(() => {
        setSelectedImage(preview);
        setImageFade(false);
      }, 200);
    }
  };

  // Add product to cart
  const handleAddToCart = () => {
    const hasOptions = Object.keys(selectedOptions).length > 0;
    const optionKey = hasOptions
      ? Object.entries(selectedOptions)
          .map(([k, v]) => `${k}:${v}`)
          .sort()
          .join("|")
      : "default";

    const cartItem = {
      id: product.productID,
      name: product.productTitle,
      price: parseFloat(product.listPrice) || 0,
      qty: parseInt(quantity) || 1,
      stock: product.stock,
      pic: selectedPreview
        ? selectedPreview.replace(API_BASE, "")
        : product.productImage,
      optionKey,
      ...(hasOptions && {
        optionName: Object.keys(selectedOptions).join(", "),
        optionValue: Object.values(selectedOptions).join(", "),
      }),
    };

    addToCart(cartItem);
    setAddedMessage("Added to cart ✓");
    setTimeout(() => setAddedMessage(""), 1500);
  };

  const originalPrice = parseFloat(product.listPrice) || 0;
  const discountedPrice = (originalPrice * (1 - discount / 100)).toFixed(2);

  return (
    <section className="product-page">
      <div className="product-container">
        <button className="btn-back" onClick={() => navigate(-1)}>✕</button>

        {/* Product Image */}
        <div className="product-image">
          <img
            src={selectedImage}
            alt={product.productTitle}
            className={`fade-image ${imageFade ? "fade" : ""}`}
            onError={(e) => (e.target.src = "/placeholder.png")}
          />
        </div>

        {/* Product Details */}
        <div className="product-details">
          <h1 className="product-title">
            {product.productTitle}
            <br />
            <span className="product-category">{categoryName}</span>
          </h1>

          <div className="price-section">
            <p>
              <span className="discounted-price">${discountedPrice}</span>
              <span className="discount-badge"> -{discount}% </span>
              <br />
              <span className="original-price">
                Price: ${originalPrice.toFixed(2)}
              </span>
            </p>
          </div>

          <p className="product-description">
            {product.productDescription || "No description available."}
          </p>

          {/* Options */}
          {Object.keys(options).length > 0 && (
            <div className="option-section">
              {Object.keys(options).map((optionName) => (
                <div key={optionName} className="option-group">
                  <span className="option-label">{optionName}</span>
                  <div className="option-values">
                    <button
                      className={`option-btn ${!selectedOptions[optionName] ? "active" : ""}`}
                      onClick={() =>
                        handleOptionChange(optionName, null, null, true)
                      }
                    >
                      Default
                    </button>
                    {options[optionName].map((opt, idx) => (
                      <button
                        key={idx}
                        className={`option-btn ${
                          selectedOptions[optionName] === opt.optionValue ? "active" : ""
                        }`}
                        onClick={() =>
                          handleOptionChange(optionName, opt.optionValue, opt.preview)
                        }
                      >
                        {opt.optionValue}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Quantity & Stock */}
          <div className="quantity-section">
            <p>
              <span>Quantity: </span>
              <input
                type="number"
                min="1"
                max={product.stock}
                value={quantity}
                onChange={(e) =>
                  setQuantity(Math.max(1, Math.min(product.stock, e.target.value)))
                }
              />
              <span
                className={`stock ${product.stock > 0 ? "in-stock" : "out-of-stock"}`}
              >
                {product.stock > 0
                  ? `In Stock: ${product.stock}`
                  : "Out of Stock"}
              </span>
            </p>
          </div>

          {/* Add to Cart */}
          <button
            className="btn-add-cart"
            disabled={product.stock === 0}
            onClick={handleAddToCart}
          >
            Add To Cart
          </button>

          {addedMessage && (
            <div className="added-message text-success mt-2">{addedMessage}</div>
          )}
        </div>
      </div>
    </section>
  );
}
