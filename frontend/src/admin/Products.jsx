import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import useAdminAuth from "./useAdminAuth";

export default function Products() {
  const navigate = useNavigate();
  const { loading, user } = useAdminAuth(); // ✅ centralized admin auth
  const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [fetching, setFetching] = useState(false);

  axios.defaults.withCredentials = true;

  // ✅ Fetch products (supports search)
  const fetchProducts = useCallback(async () => {
    try {
      setFetching(true);
      const res = await axios.get(`${API}/api/products`, {
        params: { keyword: search.trim() },
        withCredentials: true,
      });

      setProducts(res.data);
      setError("");
    } catch (err) {
      console.error("❌ Fetch products failed:", err);
      setError("Failed to fetch products.");
    } finally {
      setFetching(false);
    }
  }, [search, API]);

  // ✅ Auto-fetch after authentication
  useEffect(() => {
    if (!loading) fetchProducts();
  }, [loading, fetchProducts]);

  // ✅ Debounce search (0.5s delay)
  useEffect(() => {
    const delay = setTimeout(() => {
      if (!loading) fetchProducts();
    }, 500);
    return () => clearTimeout(delay);
  }, [search, fetchProducts, loading]);

  // ✅ Get full image URL
  const getImageUrl = (imagePath) => {
    if (!imagePath) return `${API}/uploads/default.png`;
    return imagePath.startsWith("http") ? imagePath : `${API}${imagePath}`;
  };

  // ✅ Delete product with confirmation
  const removeProduct = async (productID) => {
    if (!window.confirm("Are you sure you want to remove this product?")) return;
    try {
      await axios.delete(`${API}/api/products/${productID}`, {
        withCredentials: true,
      });
      fetchProducts();
    } catch (err) {
      console.error("❌ Delete failed:", err);
      setError("Failed to delete product.");
    }
  };

  // ✅ Navigation
  const handleUpdate = (productID) => navigate(`/admin/update/${productID}`);
  const handleOptions = (productID) => navigate(`/admin/options/${productID}`);
  const handleAddNewProduct = () => navigate("/admin/products/upload");

  if (loading) return <div className="loading">Checking authentication...</div>;

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
            className="form-control"
          />
          <button onClick={fetchProducts} className="btn btn-secondary ms-2">
            🔍
          </button>
          <button
            onClick={handleAddNewProduct}
            className="btn btn-success ms-2"
          >
            + Add New Product
          </button>
        </div>
      </header>

      {error && (
        <div className="errors text-danger text-center my-2">
          <label>{error}</label>
        </div>
      )}

      {fetching ? (
        <p className="text-center mt-4">Loading products...</p>
      ) : products.length === 0 ? (
        <p className="text-center mt-4 text-muted">
          No products found. Try adjusting your search.
        </p>
      ) : (
        <section className="info table-responsive">
          <table className="table table-bordered table-striped align-middle">
            <thead className="table-dark">
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
                <th>Options</th>
                <th>Update</th>
                <th>Remove</th>
              </tr>
            </thead>

            <tbody>
              {products.map((product) => (
                <tr key={product.productID}>
                  <td>
                    <img
                      src={getImageUrl(product.productImage)}
                      alt={product.productTitle}
                      style={{
                        width: "115px",
                        height: "125px",
                        objectFit: "cover",
                        border: "1px solid #ccc",
                        borderRadius: "5px",
                      }}
                      onError={(e) =>
                        (e.target.src = `${API}/uploads/default.png`)
                      }
                    />
                  </td>
                  <td>{product.productSKU}</td>
                  <td>{product.productTitle}</td>
                  <td>{product.animeName}</td>
                  <td>{product.categoryName}</td>
                  <td
                    style={{
                      maxWidth: "250px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {product.productDescription}
                  </td>
                  <td>${product.listPrice}</td>
                  <td>
                    {product.discountedPrice
                      ? `$${product.discountedPrice}`
                      : "-"}
                  </td>
                  <td>{product.stock}</td>
                  <td>
                    {product.hasOptions ? (
                      <button
                        onClick={() => handleOptions(product.productID)}
                        className="btn btn-outline-primary btn-sm"
                      >
                        Options
                      </button>
                    ) : (
                      <button
                        disabled
                        className="btn btn-outline-secondary btn-sm"
                      >
                        No Options
                      </button>
                    )}
                  </td>
                  <td>
                    <button
                      onClick={() => handleUpdate(product.productID)}
                      className="btn btn-warning btn-sm"
                    >
                      Update
                    </button>
                  </td>
                  <td>
                    <button
                      onClick={() => removeProduct(product.productID)}
                      className="btn btn-danger btn-sm"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </section>
  );
}
