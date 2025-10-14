import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Modal, Button } from "react-bootstrap";

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
  const [showModal, setShowModal] = useState(false);

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

        // Calculate totals if not provided
        const items = data.items || [];
        const subTotal = items.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1), 0);
        const tax = subTotal * 0.12;
        const total = subTotal + tax;

        setOrder({ ...data, subTotal, tax, total });

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
    status = "Order Placed",
  } = order;

  const estimatedDelivery = new Date(new Date(created_at).getTime() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString();

  const steps = ["Order Placed", "Processing", "In Transit", "Out for Delivery", "Delivered"];
  const activeIndex = steps.indexOf(status);

  return (
    <div className="thankyou container my-5">
      <div className="text-center mb-4">
        <h2 className="heading"><span>Thank you</span> for your order!</h2>
      </div>

      {/* Receipt */}
      <div className="card shadow-sm mb-4">
        <div className="card-header bg-primary text-white mb-2">Receipt Order #{ordNo}</div>
        <div className="card-body">
          {items.map((item) => (
            <div className="d-flex justify-content-between border-bottom pb-2 mb-2 align-items-center">
            <div className="d-flex align-items-center">
                <div>
                <strong>{item.name}</strong> <br />
                qty: {item.quantity || 1} <br />
                </div>
            </div>
            <div>${formatPrice((item.price || 0) * (item.quantity || 1))}</div>
            </div>
          ))}

          {/* Totals */}
          <div className="d-flex justify-content-between mt-3">
            <span><strong><br />Subtotal:</strong></span>
            <span><br />${formatPrice(subTotal)}</span>
          </div>
          <div className="d-flex justify-content-between">
            <span><strong>Tax (12%):</strong></span>
            <span>${formatPrice(tax)}</span>
          </div>
          <div className="d-flex justify-content-between fs-5 mt-2 border-top pt-2">
            <span><strong><br />Total:</strong></span>
            <strong>${formatPrice(total)}</strong>
          </div>

          <hr />

          {/* Payment */}
         <div className="d-flex justify-content-between">
            <h6><strong>Payment Method</strong></h6>
            <p>
                {payment?.cardName || ""} ({payment?.cardType || "Card"})<br />
                **********{payment?.cardNum_last4 || "****"} 
            </p>
          </div>

          {/* Shipping */}


          <h6><br /><strong>Shipping Address</strong></h6>
          <p><span>
            {address?.fullName || ""}<br />
            {address?.unit ? `${address.unit} - ` : ""}{address?.address || ""}<br />
            {address?.city || ""}, {address?.state || ""}<br />
            {address?.country || ""}, {address?.zipCode || ""}<br />
            {address?.phoneNum || ""}<br /><br />
            <b>Estimated Delivery:</b> {estimatedDelivery}
          </span></p>

          {/* Track Button */}
          <div className="text-center mt-3">
            <Button variant="primary" onClick={() => setShowModal(true)}>Track Your Order</Button>
          </div>
        </div>
      </div>

      {/* Continue Shopping */}
      <div className="text-center mt-3">
        <button className="btn btn-outline-primary me-2" onClick={() => navigate("/")}>Continue Shopping</button>
      </div>

      {/* Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Order Status - #{ordNo}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="progressbar d-flex justify-content-between mb-3">
            {steps.map((step, i) => (
              <div key={i} className={`text-center flex-fill position-relative ${i <= activeIndex ? "active" : ""}`}>
                <span style={{
                  display: "block",
                  width: 25,
                  height: 25,
                  margin: "0 auto 5px auto",
                  borderRadius: "50%",
                  background: i <= activeIndex ? "#0d6efd" : "#ccc",
                }}></span>
                <small>{step}</small>
                {i < steps.length - 1 && (
                  <div style={{
                    position: "absolute",
                    top: 12,
                    left: "50%",
                    width: "100%",
                    height: 3,
                    background: i < activeIndex ? "#0d6efd" : "#ccc",
                    zIndex: -1,
                  }}></div>
                )}
              </div>
            ))}
          </div>
        </Modal.Body>
      </Modal>
    </div>
  );
}
