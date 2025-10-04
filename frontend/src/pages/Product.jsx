import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";

function getImageUrl(filename) {
  if (!filename) return null;
  return `http://localhost:5000${filename.startsWith("/uploads/") ? filename : `/uploads/${filename}`}`;
}

export default function Product({ cart, setCart }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [options, setOptions] = useState([]);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [selectedImage, setSelectedImage] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const discount = 0.3;

  useEffect(() => {
    axios
      .get(`http://localhost:5000/api/products/${id}`)
      .then((res) => {
        const prod = res.data.product;
        setProduct(prod);
        setOptions(res.data.options || []);
        setSelectedImage(prod.productImage);

        // Initialize options with the first value for each group
        const initialSelections = {};
        res.data.options?.forEach((opt) => {
          if (!initialSelections[opt.optionName]) {
            initialSelections[opt.optionName] = opt.optionValue;
            if (opt.preview) setSelectedImage(opt.preview);
          }
        });
        setSelectedOptions(initialSelections);
      })
      .catch((err) => console.error(err));
  }, [id]);

  const handleAddToCart = () => {
    if (!cart || !product) return;

    const item = {
      productID: product.productID,
      name: product.productTitle,
      price: product.listPrice * (1 - discount),
      qty: quantity,
      stock: product.stock,
      pic: selectedImage || product.productImage,
      options: selectedOptions,
    };

    const index = cart.findIndex(
      (i) =>
        i.productID === item.productID &&
        JSON.stringify(i.options) === JSON.stringify(item.options)
    );

    if (index !== -1) {
      const updatedCart = [...cart];
      updatedCart[index].qty += quantity;
      setCart(updatedCart);
    } else {
      setCart([...cart, item]);
    }
  };

  const handleOptionChange = (optionName, value, preview = null) => {
    setSelectedOptions((prev) => ({ ...prev, [optionName]: value }));
    if (preview) setSelectedImage(preview);
    else setSelectedImage(product.productImage);
  };

  if (!product) return <div>Loading...</div>;

  const groupedOptions = options.reduce((acc, opt) => {
    if (!acc[opt.optionName]) acc[opt.optionName] = [];
    acc[opt.optionName].push(opt);
    return acc;
  }, {});

  return (
    <div className="product-page container">
      <button className="btn btn-secondary btn-back" onClick={() => navigate(-1)}>
        <FaArrowLeft /> Back
      </button>

      <div className="product-container">
        {/* Left panel - image */}
        <div className="product-image">
          <img src={getImageUrl(selectedImage)} alt={product.productTitle} />
        </div>

        {/* Right panel - details */}
        <div className="product-details">
          <h1 className="product-title">{product.productTitle}</h1>

          <div className="product-description">
            <p>{product.productDescription}</p>
          </div>

          {/* Options */}
          {Object.keys(groupedOptions).length > 0 &&
            Object.keys(groupedOptions).map((optName, idx) => (
              <div key={idx} className="option-group">
                <p className="option-label">{optName}:</p>
                <div className="option-circles">
                  {groupedOptions[optName].map((opt, i) => (
                    <div
                      key={i}
                      className={`option-circle ${selectedOptions[optName] === opt.optionValue ? "selected" : ""}`}
                      style={{
                        backgroundImage: opt.preview ? `url(${getImageUrl(opt.preview)})` : "none",
                        backgroundColor: !opt.preview ? opt.optionValue.toLowerCase() : "transparent",
                      }}
                      onClick={() => handleOptionChange(optName, opt.optionValue, opt.preview)}
                      title={opt.optionValue}
                    >
                      {!opt.preview && <span className="circle-label">{opt.optionValue}</span>}
                    </div>
                  ))}
                </div>
              </div>
            ))}

          <div className="price-stock">
            <h3 className="original-price">Original: <del>${product.listPrice}</del></h3>
            <h3 className="discounted-price">Discounted: ${(product.listPrice * (1 - discount)).toFixed(2)}</h3>
            <h4 className="stock">Available Stock: {product.stock}</h4>
          </div>

          <div className="quantity-add">
            <label>Qty:</label>
            <input
              type="number"
              className="form-control qty-input"
              value={quantity}
              min={1}
              max={product.stock}
              onChange={(e) => setQuantity(parseInt(e.target.value))}
            />
            <button className="btn btn-primary btn-add-cart" onClick={handleAddToCart}>
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
