import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

//  Use backend URL dynamically
const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

// Convert image filenames to full URLs
function getImageUrl(filename) {
  if (!filename) return "/placeholder.png";
  if (typeof filename === "string" && filename.startsWith("http")) return filename;
  return `${API_BASE}${
    filename.startsWith("/uploads/") ? filename : `/uploads/${filename}`
  }`;
}

// Generate a unique cart key for each product/option combo
function makeItemKey(item) {
  const pid =
    item.id ??
    item.productID ??
    item.productId ??
    item.productid ??
    item.productID;
  const optionName = item.optionName ?? "default";
  const optionValue = item.optionValue ?? "default";
  return `${pid}-${optionName}-${optionValue}`;
}

export default function Cart({
  initialCart = [],
  setCart = () => {},
  userLoggedIn = false,
  siteDiscount = 0,
}) {
  const navigate = useNavigate();
  const [cart, updateCart] = useState([]);
  const [error, setError] = useState("");
  const [totals, setTotals] = useState({ price: 0, tax: 0, total: 0 });
  const TAX_RATE = 0.12;

  // Normalize incoming cart when it changes
  useEffect(() => {
    const normalized = initialCart.map((it) => {
      const item = { ...it };
      item.price =
        typeof item.price === "string" ? parseFloat(item.price) || 0 : item.price ?? 0;
      item.qty = Number.isFinite(item.qty) ? item.qty : parseInt(item.qty) || 1;
      item.id = item.id ?? item.productID ?? item.productId;
      item.stock = item.stock ?? 9999;
      item.key = item.key ?? makeItemKey(item);
      return item;
    });
    updateCart(normalized);
  }, [initialCart]);

  // Recalculate totals when cart or discount changes
  useEffect(() => {
    let subtotal = 0;
    for (const item of cart) {
      const price = Number(item.price) || 0;
      const discounted = price * (1 - (Number(siteDiscount) || 0) / 100);
      subtotal += discounted * (Number(item.qty) || 0);
    }
    const tax = subtotal * TAX_RATE;
    setTotals({ price: subtotal, tax, total: subtotal + tax });
  }, [cart, siteDiscount]);

  // Remove item from cart
  const handleRemove = (key) => {
    setCart((prev) => {
      const updated = prev.filter((it) => (it.key ?? makeItemKey(it)) !== key);
      updateCart(updated);
      return updated;
    });
  };

  // Update quantity safely (min 1, max stock)
  const handleQuantityChange = (key, qty) => {
    const q = Number(qty) || 1;
    setCart((prev) => {
      const updated = prev.map((it) => {
        const itKey = it.key ?? makeItemKey(it);
        if (itKey === key) {
          const clamped = Math.max(1, Math.min(it.stock ?? 9999, q));
          return { ...it, qty: clamped, key: it.key ?? itKey };
        }
        return it;
      });
      updateCart(updated);
      return updated;
    });
  };

  // Handle checkout logic
  const handleCheckout = () => {
    sessionStorage.setItem("checkoutCart", JSON.stringify(cart));
    navigate("/checkout");
  };

  if (!cart || cart.length === 0) {
    return (
      <section className="cart-section">
        <h2 className="heading">
          Your <span>Cart</span> is empty
        </h2>
        <div className="text-center">
          <button className="btn" onClick={() => navigate("/")}>
            Shop Now
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="cart-section">
      <h2 className="heading">
        My <span>Shopping Cart</span>
      </h2>

      {error && <div className="alert alert-danger text-center">{error}</div>}

      <div className="cart-container">
        {/* ---------- CART TABLE ---------- */}
        <div className="cart-table-wrapper">
          <table className="cart-table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Price</th>
                <th>Quantity</th>
                <th>Total</th>
                <th>Remove</th>
              </tr>
            </thead>
            <tbody>
              {cart.map((item) => {
                const discounted =
                  (Number(item.price) || 0) *
                  (1 - (Number(siteDiscount) || 0) / 100);
                const totalPrice = discounted * (Number(item.qty) || 0);
                const key = item.key ?? makeItemKey(item);
                return (
                  <tr key={key}>
                    <td>
                      <div className="cart-product">
                        <img
                          src={getImageUrl(item.pic)}
                          alt={item.name}
                          onError={(e) => (e.target.src = "/placeholder.png")}
                        />
                        <div className="cart-product-info">
                          <h5>{item.name}</h5>
                          {item.optionName &&
                            (item.optionValue || item.optionValue === "") && (
                              <p className="option">
                                {item.optionName}: {item.optionValue}
                              </p>
                            )}
                        </div>
                      </div>
                    </td>
                    <td>${discounted.toFixed(2)}</td>
                    <td>
                      <input
                        type="number"
                        value={item.qty}
                        min="1"
                        max={item.stock}
                        onChange={(e) =>
                          handleQuantityChange(key, parseInt(e.target.value, 10) || 1)
                        }
                        className="qty-input"
                      />
                    </td>
                    <td>${totalPrice.toFixed(2)}</td>
                    <td>
                      <button
                        className="remove-btn"
                        onClick={() => handleRemove(key)}
                      >
                        <i className="fa fa-times" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ---------- ORDER SUMMARY ---------- */}
        <div className="cart-summary">
          <h3>Order Summary</h3>
          <div className="summary-row">
            <span>Subtotal:</span>
            <strong>${totals.price.toFixed(2)}</strong>
          </div>
          <div className="summary-row">
            <span>Tax (12%):</span>
            <strong>${totals.tax.toFixed(2)}</strong>
          </div>
          <div className="summary-row total">
            <span>Total:</span>
            <strong>${totals.total.toFixed(2)}</strong>
          </div>
          <button className="btn-checkout" onClick={handleCheckout}>
            Checkout
          </button>
        </div>
      </div>
    </section>
  );
}
