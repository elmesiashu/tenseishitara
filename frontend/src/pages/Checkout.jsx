import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const TAX_RATE = 0.1; // 10% tax

const Checkout = () => {
  const [cart, setCart] = useState([]);
  const [subTotal, setSubTotal] = useState(0);
  const [tax, setTax] = useState(0);
  const [total, setTotal] = useState(0);
  const [userInfo, setUserInfo] = useState({
    name: "",
    email: "",
    address: "",
  });

  const navigate = useNavigate();

  useEffect(() => {
    const stored = JSON.parse(sessionStorage.getItem("checkoutCart")) || [];
    setCart(stored);
  }, []);

  useEffect(() => {
    if (cart.length > 0) {
      let subtotal = 0;
      cart.forEach((item) => {
        subtotal += (Number(item.price) || 0) * (Number(item.qty) || 1);
      });
      const taxValue = subtotal * TAX_RATE;
      setSubTotal(subtotal);
      setTax(taxValue);
      setTotal(subtotal + taxValue);
    }
  }, [cart]);

  const handleOrder = async () => {
    if (!userInfo.name || !userInfo.email || !userInfo.address) {
      alert("Please fill in all fields.");
      return;
    }

    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/api/orders`, {
        user: userInfo,
        items: cart,
        subTotal,
        tax,
        total,
      });

      // Clear cart after successful order
      sessionStorage.removeItem("checkoutCart");
      localStorage.removeItem("cart");

      navigate("/thankyou");
    } catch (error) {
      console.error("Order submission failed:", error);
      alert("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="checkout-page container py-5">
      <h2 className="mb-4">Checkout</h2>

      {cart.length === 0 ? (
        <p>Your cart is empty.</p>
      ) : (
        <div className="row">
          {/* Left - User Info */}
          <div className="col-md-6 mb-4">
            <h4>Billing Information</h4>
            <form>
              <div className="mb-3">
                <label>Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={userInfo.name}
                  onChange={(e) =>
                    setUserInfo({ ...userInfo, name: e.target.value })
                  }
                />
              </div>
              <div className="mb-3">
                <label>Email</label>
                <input
                  type="email"
                  className="form-control"
                  value={userInfo.email}
                  onChange={(e) =>
                    setUserInfo({ ...userInfo, email: e.target.value })
                  }
                />
              </div>
              <div className="mb-3">
                <label>Address</label>
                <textarea
                  className="form-control"
                  value={userInfo.address}
                  onChange={(e) =>
                    setUserInfo({ ...userInfo, address: e.target.value })
                  }
                ></textarea>
              </div>
            </form>
          </div>

          {/* Right - Order Summary */}
          <div className="col-md-6">
            <h4>Order Summary</h4>
            <ul className="list-group mb-3">
              {cart.map((item) => (
                <li
                  className="list-group-item d-flex justify-content-between align-items-center"
                  key={item.id}
                >
                  <div>
                    <strong>{item.name}</strong> × {item.qty}
                  </div>
                  <div>${(item.price * item.qty).toFixed(2)}</div>
                </li>
              ))}
              <li className="list-group-item d-flex justify-content-between">
                <span>Subtotal</span>
                <strong>${subTotal.toFixed(2)}</strong>
              </li>
              <li className="list-group-item d-flex justify-content-between">
                <span>Tax (10%)</span>
                <strong>${tax.toFixed(2)}</strong>
              </li>
              <li className="list-group-item d-flex justify-content-between">
                <span>Total</span>
                <strong>${total.toFixed(2)}</strong>
              </li>
            </ul>

            <button className="btn btn-success w-100" onClick={handleOrder}>
              Place Order
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Checkout;
