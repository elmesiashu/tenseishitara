import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "react-bootstrap";

const API_BASE = process.env.REACT_APP_API_URL || window.location.origin;

export default function Order() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const steps = ["Order Placed", "Processing", "In Transit", "Out for Delivery", "Delivered"];

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/orders/user`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error("User not logged in or failed to fetch orders");
        const data = await res.json();
        if (!Array.isArray(data)) throw new Error("Invalid response format");
        setOrders(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  if (loading) return <div className="text-center mt-5">Loading your orders...</div>;
  if (error) return <div className="alert alert-danger text-center mt-5">{error}</div>;
  if (orders.length === 0) return <div className="text-center mt-5">You have no orders yet.</div>;

  return (
    <div className="container my-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold text-primary">Your Orders</h2>
        <Button variant="outline-primary" onClick={() => navigate("/")}>Continue Shopping</Button>
      </div>

      {orders.map((order) => {
        const activeIndex = steps.indexOf(order.status || "Order Placed");
        const createdAt = new Date(order.created_at).toLocaleString();

        return (
          <div key={order.orderID} className="card shadow-sm mb-4 border-0">
            <div className="card-header bg-primary text-white">
              <div className="d-flex justify-content-between align-items-center">
                <span>Order #{order.orderID}</span>
                <small>{createdAt}</small>
              </div>
            </div>
            <div className="card-body">
              <h6 className="fw-bold mb-3">Order Status: <span className="text-success">{order.status}</span></h6>

              {/* --- Progress bar --- */}
              <div className="progressbar d-flex justify-content-between position-relative mb-4" style={{ gap: "1rem" }}>
                {steps.map((step, i) => (
                  <div key={i} className="text-center flex-fill position-relative">
                    <div
                      style={{
                        width: 26,
                        height: 26,
                        margin: "0 auto",
                        borderRadius: "50%",
                        background: i <= activeIndex ? "#0d6efd" : "#ccc",
                        position: "relative",
                        zIndex: 2,
                      }}
                    ></div>
                    <small className="d-block mt-1">{step}</small>
                    {i < steps.length - 1 && (
                      <div
                        style={{
                          position: "absolute",
                          top: 12,
                          left: "50%",
                          width: "100%",
                          height: 3,
                          background: i < activeIndex ? "#0d6efd" : "#ccc",
                          zIndex: 1,
                        }}
                      ></div>
                    )}
                  </div>
                ))}
              </div>

              {/* --- Items --- */}
              {order.items && order.items.map((item) => (
                <div key={item.id} className="d-flex justify-content-between border-bottom pb-2 mb-2">
                  <div>
                    <strong>{item.name}</strong> <br />
                    Qty: {item.quantity || 1}
                  </div>
                  <span>${Number(item.price).toFixed(2)}</span>
                </div>
              ))}

              <div className="d-flex justify-content-between fw-bold mt-3">
                <span>Total:</span>
                <span>${Number(order.total).toFixed(2)}</span>
              </div>

              <div className="text-end mt-3">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate(`/thankyou/${order.orderID}`, { state: { orderID: order.orderID } })}
                >
                  View Details
                </Button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
