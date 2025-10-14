import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const API_BASE = process.env.REACT_APP_API_URL || window.location.origin;

function getImageUrl(filename) {
  if (!filename || typeof filename !== "string" || filename.trim() === "") return "/images/placeholder.png";
  if (filename.startsWith("http")) return filename;
  if (filename.startsWith("/uploads/")) return `${API_BASE}${filename}`;
  return `${API_BASE}/uploads/${filename}`;
}

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
        const res = await fetch(`${API_BASE}/api/order/${orderID}`, {
          credentials: "include",
        });
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

  if (!order && !location.state) return <div className="text-center mt-5">Loading your order...</div>;

  const {
    items = location.state?.items || [],
    subTotal = location.state?.subTotal || 0,
    tax = location.state?.tax || 0,
    total = location.state?.total || 0,
    payment = location.state?.payment || {},
    address = location.state?.address || {},
    orderID: ordNo = location.state?.orderID,
    created_at = location.state?.created_at || new Date().toISOString(),
  } = order || {};

  const estimatedDelivery = new Date(new Date(created_at).getTime() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString();

  return (
    <div className="thankyou container my-5">
      <div className="text-center mb-4">
        <h2>Thank you for your order!</h2>
        <p className="text-muted">Order #{ordNo}</p>
      </div>

      {/* Receipt Card */}
      <div className="card shadow-sm mb-4">
        <div className="card-header bg-primary text-white">Order Summary</div>
        <div className="card-body">
          {items.map((item) => (
            <div
              key={item.orderItemID || item.id || item.productID}
              className="d-flex justify-content-between border-bottom pb-2 mb-2 align-items-center"
            >
              <div className="d-flex align-items-center">
                <img
                  src={getImageUrl(item.image || "/images/placeholder.png")}
                  alt={item.name}
                  width="60"
                  className="me-2 rounded"
                />
                <div>
                  <strong>{item.name}</strong> x {item.quantity || 1}
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
            <h6>Payment Method</h6>
            <p>{payment?.cardName || ""} ****{payment?.cardNum_last4 || "****"} ({payment?.cardType || "Card"})</p>
          </div>

          {/* Shipping */}
          <div>
            <h6>Shipping Address</h6>
            <p>
              {address?.fullName || ""}<br />
              {address?.unit ? `${address.unit} - ` : ""}{address?.address || ""}<br />
              {address?.city || ""}, {address?.state || ""}<br />
              {address?.country || ""}, {address?.zipCode || ""}<br />
              {address?.phoneNum || ""}<br />
              <b>Estimated Delivery:</b> {estimatedDelivery}
            </p>
          </div>

          {/* Track Button inside receipt */}
          <div className="text-center mt-3">
            <button className="btn btn-primary" onClick={() => navigate(`/track/${ordNo}`)}>
              Track Your Order
            </button>
          </div>
        </div>
      </div>

      {/* Continue Shopping outside receipt */}
      <div className="text-center mt-3">
        <button className="btn btn-outline-primary me-2" onClick={() => navigate("/")}>
          Continue Shopping
        </button>
      </div>
    </div>
  );
}
