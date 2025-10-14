import React, { useEffect, useState } from "react";
import { Card, ProgressBar } from "react-bootstrap";

const API_BASE = process.env.REACT_APP_API_URL || window.location.origin;

export default function Order() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const userID = localStorage.getItem("userID");

  useEffect(() => {
    if (!userID) {
      setError("User not logged in");
      setLoading(false);
      return;
    }

    const fetchOrders = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/orders/user/${userID}`);
        if (!res.ok) throw new Error("Failed to fetch orders");
        const data = await res.json();

        // Ensure data is always an array
        setOrders(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed loading order:", err);
        setError("Could not load orders");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [userID]);

  const getProgressValue = (status) => {
    switch (status) {
      case "Order Placed":
        return 25;
      case "Processing":
        return 50;
      case "Shipped":
        return 75;
      case "Delivered":
        return 100;
      default:
        return 0;
    }
  };

  if (loading) return <div className="text-center my-5">Loading orders...</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;
  if (orders.length === 0) return <div className="text-center my-5">No orders found.</div>;

  return (
    <div className="container my-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold text-primary">My Orders</h2>
      </div>

      {orders.map((order) => (
        <Card key={order.orderID} className="mb-4 shadow-sm border-0 rounded-4 p-3">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h5 className="mb-1 text-dark">Order #{order.orderID}</h5>
              <p className="text-muted mb-1">
                <strong>Date:</strong> {new Date(order.created_at).toLocaleString()}
              </p>
              <p className="text-muted mb-1">
                <strong>Total:</strong> ${parseFloat(order.total).toFixed(2)}
              </p>
              <p className="text-muted mb-2">
                <strong>Status:</strong> {order.status}
              </p>
              <ProgressBar
                now={getProgressValue(order.status)}
                label={`${getProgressValue(order.status)}%`}
                className="progress-sm"
              />
            </div>
            <div className="text-end">
              <h6 className="text-secondary">Tracking Number</h6>
              <p className="fw-bold">{order.trackingNumber}</p>
            </div>
          </div>

          <hr />

          <div className="order-items row">
            {order.items &&
              order.items.map((item) => (
                <div className="col-md-3 text-center" key={item.orderItemID}>
                  <img
                    src={item.image || "/images/placeholder.png"}
                    alt={item.name}
                    className="img-fluid rounded-3 mb-2"
                    style={{ width: "100px", height: "100px", objectFit: "cover" }}
                  />
                  <p className="fw-bold mb-0">{item.name}</p>
                  <small className="text-muted">
                    {item.quantity} × ${item.price}
                  </small>
                </div>
              ))}
          </div>
        </Card>
      ))}
    </div>
  );
}
