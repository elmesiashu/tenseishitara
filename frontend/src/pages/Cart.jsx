import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function getImageUrl(filename) {
  if (!filename) return null;
  return `http://localhost:5000${
    filename.startsWith("/uploads/") ? filename : `/uploads/${filename}`
  }`;
}

export default function Cart({
  initialCart = [],
  setCart = () => {},
  userLoggedIn = false,
  siteDiscount = 0,
}) {
  const navigate = useNavigate();
  const [cart, updateCart] = useState(initialCart);
  const [error, setError] = useState("");
  const [totals, setTotals] = useState({ price: 0, tax: 0, total: 0 });
  const TAX_RATE = 0.12;

  useEffect(() => updateCart(initialCart), [initialCart]);

  useEffect(() => {
    let subtotal = 0;
    cart.forEach((item) => {
      const discounted = item.price * (1 - siteDiscount / 100);
      subtotal += discounted * item.qty;
    });
    const tax = subtotal * TAX_RATE;
    setTotals({ price: subtotal, tax, total: subtotal + tax });
  }, [cart, siteDiscount]);

  const handleRemove = (index) => {
    const updated = [...cart];
    updated.splice(index, 1);
    updateCart(updated);
    setCart(updated);
  };

  const handleQuantityChange = (index, qty) => {
    if (qty < 1) return;
    const updated = [...cart];
    updated[index].qty = qty;
    updateCart(updated);
    setCart(updated);
  };

  const handleCheckout = () => {
    if (!userLoggedIn) {
      setError("You have to login to process your transaction");
      return;
    }
    navigate("/checkout");
  };

  if (cart.length === 0) {
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
              {cart.map((item, index) => {
                const discounted = item.price * (1 - siteDiscount / 100);
                const totalPrice = discounted * item.qty;
                return (
                  <tr key={index}>
                    <td>
                      <div className="cart-product">
                        <img
                          src={getImageUrl(item.pic)}
                          alt={item.name}
                          onError={(e) => (e.target.src = "/placeholder.png")}
                        />
                        <div className="cart-product-info">
                          <h5>{item.name}</h5>
                          {item.optionName && item.optionValue && (
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
                          handleQuantityChange(
                            index,
                            parseInt(e.target.value) || 1
                          )
                        }
                        className="qty-input"
                      />
                    </td>
                    <td>${totalPrice.toFixed(2)}</td>
                    <td>
                      <button
                        className="remove-btn"
                        onClick={() => handleRemove(index)}
                      >
                        <i className="fa fa-times"></i>
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
