import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const API_BASE = process.env.REACT_APP_API_URL || window.location.origin;

function formatPrice(val) {
  const num = Number(val);
  return isNaN(num) ? "0.00" : num.toFixed(2);
}

export default function ThankYou() {
  const navigate = useNavigate();
  const location = useLocation();
  const orderID = location.state?.orderID;

  const [order, setOrder] = useState(null);

  useEffect(() => {
    if (!orderID) {
      navigate("/");
      return;
    }

    const fetchOrder = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/order/${orderID}`, { credentials: "include" });
        if (!res.ok) throw new Error("Failed to fetch order");
        const data = await res.json();
        setOrder(data);

        // Clear cart
        sessionStorage.removeItem("checkoutCart");
        localStorage.removeItem("cart");
      } catch (err) {
        console.error(err);
        navigate("/");
      }
    };

    fetchOrder();
  }, [orderID, navigate]);

  if (!order) return <div className="text-center mt-5">Loading your order...</div>;

  const {
    items = [],
    subTotal = 0,
    tax = 0,
    total = 0,
    payment = {},
    address = {},
    orderID: ordNo,
    created_at,
  } = order;

  const estimatedDelivery = new Date(new Date(created_at).getTime() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString();

  return (
    <div className="thankyou container my-5">
      <div className="text-center mb-4">
        <h2 className="heading"><span>Thank you</span> for your order!</h2>
        <p className="text-muted">Order #{ordNo}</p>
      </div>

      {/* Receipt */}
      <div className="card shadow-sm mb-4">
        <div className="card-header bg-primary text-white mb-2">Receipt Order #{ordNo}</div>
        <div className="card-body">
          {items.map((item) => (
            <div key={item.orderItemID} className="d-flex justify-content-between border-bottom pb-2 mb-2 align-items-center">
              <div className="d-flex align-items-center">
                <img
                  src={item.image || "/images/placeholder.png"}
                  alt={item.name}
                  width="60"
                  className="me-2 rounded"
                />
                <div>
                  {item.name} <br /> qty: {item.quantity || 1}
                </div>
              </div>
              <div>${formatPrice((item.price || 0) * (item.quantity || 1))}</div>
            </div>
          ))}

          {/* Totals */}
          <div className="d-flex justify-content-between mt-3">
            <span>Subtotal:</span>
            <strong>${formatPrice(subTotal)}</strong>
          </div>
          <div className="d-flex justify-content-between">
            <span>Tax:</span>
            <strong>${formatPrice(tax)}</strong>
          </div>
          <div className="d-flex justify-content-between fs-5 mt-2 border-top pt-2">
            <span>Total:</span>
            <strong>${formatPrice(total)}</strong>
          </div>

          <hr />

          {/* Payment */}
          <div>
            <h6><strong>Payment Method</strong></h6>
            <p>
              {payment?.cardName || ""} <br />
              **********{payment?.cardNum_last4 || "****"} ({payment?.cardType || "Card"})
            </p>
          </div>

          {/* Shipping */}
          <div>
            <h6><strong>Shipping Address</strong></h6>
            <p>
              {address?.fullName || ""}<br />
              {address?.unit ? `${address.unit} - ` : ""}{address?.address || ""}<br />
              {address?.city || ""}, {address?.state || ""}<br />
              {address?.country || ""}, {address?.zipCode || ""}<br />
              {address?.phoneNum || ""}<br /><br />
              <b>Estimated Delivery:</b> {estimatedDelivery}
            </p>
          </div>

          {/* Track Button */}
          <div className="text-center mt-3">
            <button className="btn btn-primary" onClick={() => navigate(`/track/${ordNo}`)}>
              Track Your Order
            </button>
          </div>
        </div>
      </div>

      {/* Continue Shopping */}
      <div className="text-center mt-3">
        <button className="btn btn-outline-primary me-2" onClick={() => navigate("/")}>
          Continue Shopping
        </button>
      </div>
    </div>
  );
}
