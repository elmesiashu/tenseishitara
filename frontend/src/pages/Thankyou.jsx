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

  const orderID = location.state?.orderID || null;

  useEffect(() => {
    const fetchLastOrder = async () => {
      try {
        let url = `${API_BASE}/api/order/user`;
        const res = await fetch(url, { credentials: "include" });
        const orders = await res.json();
        if (!orders.length) return navigate("/");

        const lastOrder = orderID
          ? orders.find((o) => o.orderID === orderID) || orders[0]
          : orders[0];

        setOrder(lastOrder);
      } catch (err) {
        console.error(err);
      }
    };

    fetchLastOrder();
  }, [orderID, navigate]);

  if (!order) return <div className="text-center mt-5">Loading your order...</div>;

  const { items, total, subTotal, tax, payment, address, orderID: ordNo, status, created_at } = order;

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
                  {item.options.map((opt) => (
                    <p key={opt.optionID} className="text-muted">{opt.optionName}: {opt.optionValue}</p>
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
            <div className="col"><b>Subtotal:</b></div>
            <div className="col d-flex justify-content-end"><b>${subTotal?.toFixed(2) || "0.00"}</b></div>
          </div>
          <div className="row">
            <div className="col"><b>Tax:</b></div>
            <div className="col d-flex justify-content-end"><b>${tax?.toFixed(2) || "0.00"}</b></div>
          </div>
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

        {/* Track Your Order Button */}
        <div className="text-center mt-4">
          <button type="button" className="btn btn-primary d-flex mx-auto btn-lg" data-toggle="modal" data-target="#trackModal">
            Track your order
          </button>
        </div>

        {/* Track Your Order Modal */}
        <div className="modal fade" id="trackModal">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title mx-auto">Order Status<br />AWB Number-{ordNo}</h4>
                <button type="button" className="close" data-dismiss="modal">&times;</button>
              </div>
              <div className="modal-body">
                <div className="progress-track">
                  <ul id="progressbar">
                    {statusSteps.map((step, idx) => (
                      <li key={idx} className={`step0 ${currentStep > idx ? "active" : ""}`}>{step}</li>
                    ))}
                  </ul>
                </div>
                <div className="row">
                  <div className="col-9">
                    <div className="details d-table">
                      <div className="d-table-row">
                        <div className="d-table-cell">Shipped with</div>
                        <div className="d-table-cell">UPS Expedited</div>
                      </div>
                      <div className="d-table-row">
                        <div className="d-table-cell">Estimated Delivery</div>
                        <div className="d-table-cell">{estimatedDelivery}</div>
                      </div>
                    </div>
                  </div>
                  <div className="col-3">
                    <div className="d-table-row">
                      <a href="#"><i className="fa fa-phone" aria-hidden="true"></i></a>
                    </div>
                    <div className="d-table-row">
                      <a href="#"><i className="fa fa-envelope" aria-hidden="true"></i></a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <button className="btn d-flex mx-auto mt-4" onClick={() => navigate("/")}>
          Continue Shopping
        </button>
      </div>
    </div>
  );
}
