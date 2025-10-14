import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Spinner } from "react-bootstrap";

const API_BASE = process.env.REACT_APP_API_URL || window.location.origin;

const steps = [
  "Order Placed",
  "Order Processed",
  "Order Designing",
  "Shipped",
  "Delivered",
];

export default function OrderDetail() {
  const { orderID } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/order/single/${orderID}`, {
          credentials: "include",
        });
        const data = await res.json();
        if (res.ok) {
          setOrder(data);
        } else {
          console.error("Failed loading order:", data);
        }
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [orderID]);

  const getStepIndex = (status) => {
    const i = steps.indexOf(status);
    return i >= 0 ? i : 0;
  };

  if (loading) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" />
      </div>
    );
  }

  if (!order) {
    return <p className="text-center mt-5">Order not found.</p>;
  }

  const currentStep = getStepIndex(order.status);

  return (
    <div className="container my-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Order #{order.orderID}</h2>
        <button className="btn btn-outline-secondary" onClick={() => navigate(-1)}>
          Back
        </button>
      </div>

      {/* Order metadata */}
      <div className="mb-4">
        <div><strong>Tracking Number:</strong> {order.trackingNumber}</div>
        <div><strong>Status:</strong> {order.status}</div>
        <div><strong>Placed On:</strong> {new Date(order.created_at).toLocaleString()}</div>
        <div>
          <strong>Total:</strong> ${Number(order.total).toFixed(2)}
        </div>
      </div>

      {/* Progress / Timeline */}
      <div className="order-tracker-wrapper mb-5">
        <div className="order-tracker d-flex justify-content-between position-relative">
          {steps.map((step, idx) => (
            <div key={idx} className={`tracker-step ${idx <= currentStep ? "active" : ""}`}>
              <div className="icon-circle">{idx + 1}</div>
              <div className="step-label">{step}</div>
            </div>
          ))}
          <div
            className="progress-line position-absolute"
            style={{
              left: 0,
              right: 0,
              top: "24px",
              height: "4px",
              background: "#e0e0e0",
              zIndex: 1,
            }}
          />
          <div
            className="progress-line-filled position-absolute"
            style={{
              left: 0,
              top: "24px",
              height: "4px",
              width: `${(currentStep / (steps.length - 1)) * 100}%`,
              background: "#6f42c1",
              zIndex: 2,
            }}
          />
        </div>
      </div>

      {/* Items */}
      <div className="mb-4">
        <h4>Items</h4>
        {order.items?.map((it) => (
          <div key={it.orderItemID} className="d-flex align-items-center border-bottom py-2">
            <img
              src={it.image || "/images/placeholder.png"}
              alt={it.name}
              style={{ width: 80, height: 80, objectFit: "cover", marginRight: "1rem" }}
            />
            <div className="flex-grow-1">
              <div><strong>{it.name}</strong></div>
              <div>Qty: {it.quantity}</div>
              <div>Price: ${Number(it.price).toFixed(2)}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Address / Payment */}
      <div className="row">
        <div className="col-md-6 mb-3">
          <h5>Shipping Address</h5>
          {order.address ? (
            <div>
              <div>{order.address.fullName}</div>
              <div>
                {order.address.unit && order.address.unit + " - "}
                {order.address.address}
              </div>
              <div>
                {order.address.city}, {order.address.state}
              </div>
              <div>{order.address.country}, {order.address.zipCode}</div>
              <div>Phone: {order.address.phoneNum}</div>
            </div>
          ) : <div>No address info</div>}
        </div>
        <div className="col-md-6 mb-3">
          <h5>Payment Info</h5>
          {order.payment ? (
            <div>
              <div>Cardholder: {order.payment.cardName}</div>
              <div>**** **** **** {order.payment.cardNum_last4}</div>
              <div>Expires: {order.payment.expiryDate}</div>
            </div>
          ) : <div>No payment info</div>}
        </div>
      </div>
    </div>
  );
}
