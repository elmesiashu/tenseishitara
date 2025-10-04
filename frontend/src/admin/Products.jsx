import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import "../css/admin.css";

export default function Products() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  // Fetch products from backend
  const fetchProducts = useCallback(async () => {
    try {
      const res = await axios.get(
        `${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/products`,
        { params: { keyword: search } }
      );
      console.log("Products fetched from API:", res.data); // Debug
      setProducts(res.data);
      setError("");
    } catch (err) {
      console.error(err);
      setError("Failed to fetch products.");
    }
  }, [search]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Get full image URL for frontend
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    const baseUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";
    return `${baseUrl}${imagePath}`;
  };

  // Delete product
  const removeProduct = async (productID) => {
    if (!window.confirm("Are you sure you want to remove this product?")) return;
    try {
      await axios.delete(
        `${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/products/${productID}`
      );
      fetchProducts();
    } catch (err) {
      console.error(err);
      setError("Failed to delete product");
    }
  };

  // Navigate to update page
  const handleUpdate = (productID) => {
    window.location.href = `/admin/update/${productID}`;
  };

  // Navigate to options page
  const handleOptions = (productID) => {
    window.location.href = `/admin/options/${productID}`;
  };

  return (
    <section className="uploadInfo">
      <header className="uHeader">
        <div className="head1">
          <h1>Product Management</h1>
        </div>
        <div className="head2">
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button onClick={fetchProducts} className="btn btn-secondary">🔍</button>
          <button
            onClick={() => (window.location.href = "/admin/uploadproduct")}
            className="btn"
          >
            Add New Product
          </button>
        </div>
      </header>

      {error && <div className="errors"><label>{error}</label></div>}

      <section className="info">
        <table>
          <thead>
            <tr>
              <th>Image</th>
              <th>SKU</th>
              <th>Name</th>
              <th>Anime</th>
              <th>Category</th>
              <th>Description</th>
              <th>Price</th>
              <th>Discounted</th>
              <th>Stock</th>
              <th>Update</th>
              <th>Remove</th>
              <th>Options</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.productID}>
                <td>
                  {getImageUrl(product.productImage) ? (
                    <img
                      src={getImageUrl(product.productImage)}
                      alt={product.productTitle}
                      style={{
                        width: "115px",
                        height: "125px",
                        objectFit: "cover",
                        border: "1px solid #ccc",
                        borderRadius: "5px"
                      }}
                    />
                  ) : (
                    <div style={{
                      width: "115px",
                      height: "125px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "1px solid #ccc",
                      borderRadius: "5px",
                      backgroundColor: "#f0f0f0"
                    }}>No Image</div>
                  )}
                </td>
                <td>{product.productSKU}</td>
                <td>{product.productTitle}</td>
                <td>{product.animeName}</td>
                <td>{product.categoryName}</td>
                <td>{product.productDescription}</td>
                <td>${product.listPrice}</td>
                <td>${product.discountedPrice}</td>
                <td>{product.stock}</td>
                 <td>
                  {product.hasOptions ? (
                    <button onClick={() => handleOptions(product.productID)}>Options</button>
                  ) : (
                    <button disabled style={{ opacity: 0.5, cursor: "not-allowed" }}>No Options</button>
                  )}
                </td>
                <td>
                  <button onClick={() => handleUpdate(product.productID)}>Update</button>
                </td>
                <td>
                  <button onClick={() => removeProduct(product.productID)}>Remove</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </section>
  );
}
