import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { FaTimes } from "react-icons/fa";
import "../css/admin.css";
import useAdminAuth from "./useAdminAuth"; // ✅ Admin login check

export default function UploadProduct() {
  const { loading, user } = useAdminAuth(); // 🔒 Protect route
  const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

  const [product, setProduct] = useState({
    productTitle: "",
    anime: "1",
    productDescription: "",
    listPrice: "",
    stock: "",
    category: "1",
    productImage: null,
    mainPreview: null,
  });

  const [options, setOptions] = useState([]);
  const productImageRef = useRef();

  axios.defaults.withCredentials = true;

  // 🧩 Handle product inputs
  const handleProductChange = (e) => {
    const { name, value, files } = e.target;
    if (files && files[0]) {
      if (product.mainPreview) URL.revokeObjectURL(product.mainPreview);
      setProduct((prev) => ({
        ...prev,
        [name]: files[0],
        mainPreview: URL.createObjectURL(files[0]),
      }));
    } else {
      setProduct((prev) => ({ ...prev, [name]: value }));
    }
  };

  // 🧩 Handle product option input changes
  const handleOptionChange = (idx, key, value, file = null) => {
    setOptions((prevOptions) =>
      prevOptions.map((opt, i) => {
        if (i !== idx) return opt;
        if (file && file instanceof File) {
          if (opt.preview) URL.revokeObjectURL(opt.preview);
          return { ...opt, [key]: file, preview: URL.createObjectURL(file) };
        }
        return { ...opt, [key]: value };
      })
    );
  };

  // ➕ Add new option
  const addOption = () =>
    setOptions((prev) => [
      ...prev,
      { optionName: "", optionValue: "", optionImage: null, preview: null },
    ]);

  // ❌ Remove an option
  const removeOption = (idx) => {
    setOptions((prev) => {
      if (prev[idx].preview) URL.revokeObjectURL(prev[idx].preview);
      return prev.filter((_, i) => i !== idx);
    });
  };

  // 📤 Submit product form
  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();

    Object.keys(product).forEach((key) => {
      if (key !== "mainPreview" && product[key]) {
        formData.append(key, product[key]);
      }
    });

    formData.append("options", JSON.stringify(options));

    options.forEach((opt) => {
      if (opt.optionImage) {
        formData.append("optionImage", opt.optionImage);
      }
    });

    try {
      const res = await axios.post(`${API}/api/products/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });

      console.log("✅ Upload success:", res.data);
      alert("✅ Product uploaded successfully!");

      // Reset form after upload
      setProduct({
        productTitle: "",
        anime: "1",
        productDescription: "",
        listPrice: "",
        stock: "",
        category: "1",
        productImage: null,
        mainPreview: null,
      });
      setOptions([]);
      if (productImageRef.current) productImageRef.current.value = null;
    } catch (err) {
      console.error("❌ Upload failed:", err.response?.data || err.message);
      alert("❌ Upload failed. Please check your form or server logs.");
    }
  };

  // 🧹 Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      if (product.mainPreview) URL.revokeObjectURL(product.mainPreview);
      options.forEach((opt) => opt.preview && URL.revokeObjectURL(opt.preview));
    };
  }, [product.mainPreview, options]);

  // ⏳ Show loader while verifying admin session
  if (loading) return <p className="text-center mt-5">Checking admin access...</p>;

  return (
    <div className="container mt-4">
      <h2 className="text-primary mb-3">Upload Product</h2>

      <form onSubmit={handleSubmit}>
        {/* === Main Product === */}
        <div className="option-box d-flex align-items-start">
          <div className="option-image">
            {product.mainPreview && (
              <img
                src={product.mainPreview}
                alt="Product Preview"
                className="main-preview-img"
              />
            )}
          </div>

          <div className="option-fields flex-grow-1 ms-3">
            <input
              type="text"
              name="productTitle"
              placeholder="Product Name"
              className="form-control mb-2"
              value={product.productTitle}
              onChange={handleProductChange}
              required
            />

            <textarea
              name="productDescription"
              placeholder="Description"
              className="form-control mb-2"
              value={product.productDescription}
              onChange={handleProductChange}
              required
            />

            <div className="d-flex gap-2 mb-2">
              <input
                type="number"
                name="listPrice"
                placeholder="Price"
                className="form-control"
                value={product.listPrice}
                onChange={handleProductChange}
                required
              />
              <input
                type="number"
                name="stock"
                placeholder="Stock"
                className="form-control"
                value={product.stock}
                onChange={handleProductChange}
                required
              />
            </div>

            <select
              name="anime"
              className="form-select mb-2"
              value={product.anime}
              onChange={handleProductChange}
            >
              <option value="1">Chainsaw Man</option>
              <option value="2">Death Note</option>
              <option value="3">Demon Slayer</option>
              <option value="4">Jujutsu Kaisen</option>
              <option value="5">Miss Kobayashi's Dragon Maid</option>
              <option value="6">Solo Leveling</option>
              <option value="7">That Time I Got Reincarnated as a Slime</option>
              <option value="8">The Witch from Mercury</option>
              <option value="9">Attack on Titan</option>
              <option value="10">Spy x Family</option>
            </select>

            <select
              name="category"
              className="form-select mb-2"
              value={product.category}
              onChange={handleProductChange}
            >
              <option value="1">Figurine</option>
              <option value="2">Plush</option>
              <option value="3">Accessories</option>
              <option value="4">Manga</option>
              <option value="5">Novel</option>
              <option value="6">Clothes</option>
              <option value="7">Cosplay</option>
              <option value="8">Others</option>
            </select>

            <input
              type="file"
              name="productImage"
              accept="image/*"
              className="form-control"
              onChange={handleProductChange}
              ref={productImageRef}
              required
            />
          </div>
        </div>

        {/* === Product Options === */}
        {options.length > 0 && (
          <>
            <h4 className="mt-4">Product Options</h4>
            {options.map((opt, idx) => (
              <div key={idx} className="option-box d-flex align-items-start">
                <div className="option-image">
                  {opt.preview && <img src={opt.preview} alt="Option Preview" />}
                </div>

                <div className="option-fields flex-grow-1 ms-3">
                  <input
                    type="text"
                    placeholder="Option Name"
                    className="form-control mb-2"
                    value={opt.optionName}
                    onChange={(e) =>
                      handleOptionChange(idx, "optionName", e.target.value)
                    }
                  />
                  <input
                    type="text"
                    placeholder="Option Value"
                    className="form-control mb-2"
                    value={opt.optionValue}
                    onChange={(e) =>
                      handleOptionChange(idx, "optionValue", e.target.value)
                    }
                  />
                  <input
                    type="file"
                    className="form-control mb-2"
                    accept="image/*"
                    onChange={(e) =>
                      handleOptionChange(
                        idx,
                        "optionImage",
                        null,
                        e.target.files[0]
                      )
                    }
                  />
                </div>

                <FaTimes
                  className="remove-icon"
                  onClick={() => removeOption(idx)}
                  title="Remove option"
                />
              </div>
            ))}
          </>
        )}

        {/* === Buttons === */}
        <button
          type="button"
          className="btn btn-outline-primary mb-3"
          onClick={addOption}
        >
          + Add Option
        </button>

        <button type="submit" className="btn btn-success upload-btn">
          Upload Product
        </button>
      </form>
    </div>
  );
}
