// src/pages/Order.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";

// Map status to step index
export function getStepIndex(status) {
  switch (status.toLowerCase()) {
    case "order placed":
    case "processing":
      return 0;
    case "in transit":
      return 1;
    case "out for delivery":
      return 2;
    case "delivered":
      return 3;
    default:
      return 0;
  }
}

// Render order items
export function OrderItems({ items }) {
  return (
    <ul className="row list-unstyled">
      {items.map((item) => (
        <li key={item.orderItemID} className="col-md-4 mb-3">
          <figure className="itemside d-flex">
            <div className="aside">
              <img
                src={item.image || "/images/placeholder.png"}
                alt={item.name}
                className="img-sm border"
              />
            </div>
            <figcaption className="info ms-2">
              <p className="title mb-1">{item.name}</p>
              <span className="text-muted">
                ${item.price.toFixed(2)} x {item.quantity} = ${(item.price * item.quantity).toFixed(2)}
              </span>
            </figcaption>
          </figure>
        </li>
      ))}
    </ul>
  );
}

// Render progress tracker
export function ProgressTracker({ status }) {
  const activeStep = getStepIndex(status);
  const steps = ["Order Placed", "In Transit", "Out for Delivery", "Delivered"];
  const icons = ["fa-box", "fa-truck", "fa-truck-moving", "fa-check"];

  return (
    <div className="track mb-4 d-flex justify-content-between">
      {steps.map((step, idx) => (
        <div key={idx} className={`step text-center ${idx <= activeStep ? "active" : ""}`}>
          <span className="icon mb-1">
            <i className={`fa ${idx <= activeStep ? "fa-check text-success" : icons[idx]} fa-lg`}></i>
          </span>
          <div className="text">{step}</div>
        </div>
      ))}
    </div>
  );
}

// Main Orders component
function Orders({ userID }) {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await axios.get(`/api/orders/${userID}`);
        setOrders(res.data);
      } catch (err) {
        console.error("Failed to fetch orders", err);
      }
    };
    fetchOrders();
  }, [userID]);

  return (
    <div className="container my-5">
      <article className="card">
        <header className="card-header">My Orders / Tracking</header>
        <div className="card-body">
          {orders.length === 0 && <p>No orders found.</p>}

          {orders.map((order) => (
            <div key={order.orderID} className="mb-4">
              <h6>Order ID: {order.orderID}</h6>
              <article className="card mb-3">
                <div className="card-body row">
                  <div className="col">
                    <strong>Estimated Delivery time:</strong> <br />
                    {new Date(order.created_at).toLocaleDateString()}
                  </div>
                  <div className="col">
                    <strong>Shipping BY:</strong> <br />
                    BLUEDART | <i className="fa fa-phone"></i> +1598675986
                  </div>
                  <div className="col">
                    <strong>Status:</strong> <br />
                    {order.status}
                  </div>
                  <div className="col">
                    <strong>Tracking #:</strong> <br />
                    {order.trackingNumber || "-"}
                  </div>
                </div>
              </article>

              <ProgressTracker status={order.status} />
              <OrderItems items={order.items} />

              <hr />
              <div>
                <strong>Shipping Address:</strong>
                <p>
                  {order.address
                    ? `${order.address.addressLine1}, ${order.address.city}, ${order.address.postalCode}`
                    : "-"}
                </p>
                <strong>Payment Method:</strong>
                <p>{order.payment ? order.payment.method : "-"}</p>
              </div>

              <a href="/orders" className="btn btn-warning mt-2">
                <i className="fa fa-chevron-left"></i> Back to orders
              </a>
            </div>
          ))}
        </div>
      </article>
    </div>
  );
}

// Default export for proper import
export default Orders;
