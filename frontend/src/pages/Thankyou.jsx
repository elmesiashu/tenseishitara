import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const API_BASE = process.env.REACT_APP_API_URL || window.location.origin;

function getImageUrl(filename) {
  if (!filename || typeof filename !== "string" || filename.trim() === "") return "/images/placeholder.png";
  if (filename.startsWith("http")) return filename;
  if (filename.startsWith("/uploads/")) return `${API_BASE}${filename}`;
  return `${API_BASE}/uploads/${filename}`;
}

export default function ThankYou() {
  const [order, setOrder] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  const orderID = location.state?.orderID;

  useEffect(() => {
    if (!orderID) {
      navigate("/"); // no orderID, redirect to home
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

        // Clear cart session/localStorage after order
        sessionStorage.removeItem("checkoutCart");
        localStorage.removeItem("cart");
      } catch (err) {
        console.error("Error fetching order:", err);
        navigate("/"); // redirect if failed
      }
    };

    fetchOrder();
  }, [orderID, navigate]);

  if (!order) return <div className="text-center mt-5">Loading your order...</div>;

  const { items, total, payment, address, orderID: ordNo, status, created_at } = order;

  const statusSteps = ["Order Placed", "In Transit", "Out for Delivery", "Delivered"];
  const currentStep = statusSteps.indexOf(status) + 1;

  const estimatedDelivery = new Date(new Date(created_at).getTime() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString();

  return (
    <div className="card mt-50 mb-50">
      <div className="col d-flex">
        <span className="text-muted" id="orderno">Order #{ordNo}</span>
      </div>

      <div className="title mx-auto">Thank you for your order!</div>

      <div className="main">
        <span id="sub-title"><p><b>Payment Summary</b></p></span>

        {items.map((item) => (
          <div key={item.orderItemID} className="row row-main">
            <div className="col-3">
              <img className="img-fluid" src={getImageUrl(item.image)} alt={item.name} />
            </div>
            <div className="col-6">
              <div className="row d-flex">
                <p><b>{item.name}</b> x {item.quantity}</p>
              </div>
              {item.options?.length > 0 && (
                <div className="row d-flex">
                  {item.options.map((opt, idx) => (
                    <p key={idx} className="text-muted">{opt.optionName || `Option ${opt.optionID}`}: {opt.optionValue || "N/A"}</p>
                  ))}
                </div>
              )}
            </div>
            <div className="col-3 d-flex justify-content-end">
              <p><b>${(item.price * item.quantity).toFixed(2)}</b></p>
            </div>
          </div>
        ))}

        <hr />

        <div className="total">
          <div className="row">
            <div className="col"><b>Total:</b></div>
            <div className="col d-flex justify-content-end"><b>${total?.toFixed(2) || "0.00"}</b></div>
          </div>
        </div>

        <hr />

        <div className="total">
          <div className="row">
            <div className="col"><b>Transaction Type:</b></div>
            <div className="col d-flex justify-content-end"><b>{payment?.cardType || "Card"}</b></div>
          </div>
          <div className="row">
            <div className="col"><b>Payment Details:</b></div>
            <div className="col d-flex justify-content-end">
              <b>{payment?.cardName || ""} ****{payment?.cardNum_last4 || "****"}</b>
            </div>
          </div>
        </div>

        <hr />

        <div className="total">
          <div className="row">
            <div className="col"><b>Shipment Details:</b></div>
            <div className="col">
              <p>{address?.fullName}</p>
              <p>{address?.unit && `${address.unit} - `}{address?.address}</p>
              <p>{address?.city}, {address?.state}</p>
              <p>{address?.country}, {address?.zipCode}</p>
              <p>{address?.phoneNum}</p>
            </div>
          </div>
        </div>

        <div className="text-center mt-4">
          <button className="btn btn-primary btn-lg" onClick={() => navigate("/")}>
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
}
