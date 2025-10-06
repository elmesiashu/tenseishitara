import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

export default function Checkout({ cart = [], user }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    country: "",
    first_name: "",
    last_name: "",
    address: "",
    city: "",
    state: "",
    zip_code: "",
    phone_number: "",
    email_address: "",
  });
  const [subTotal, setSubTotal] = useState(0);
  const [tax, setTax] = useState(0);
  const [total, setTotal] = useState(0);
  const TAX_RATE = 0.12;

  useEffect(() => {
    let subtotal = 0;
    cart.forEach((item) => {
      subtotal += (Number(item.price) || 0) * (Number(item.qty) || 1);
    });
    const taxValue = subtotal * TAX_RATE;
    setSubTotal(subtotal);
    setTax(taxValue);
    setTotal(subtotal + taxValue);
  }, [cart]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!user) {
      alert("Please login to continue checkout.");
      navigate("/login", { state: { from: "/checkout" } });
      return;
    }

    try {
      const orderData = {
        userId: user.id,
        items: cart,
        address: form,
        total,
      };
      const res = await fetch(`${API_BASE}/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });

      if (!res.ok) throw new Error("Failed to place order");
      navigate("/thankyou");
    } catch (err) {
      console.error(err);
      alert("There was an error placing your order.");
    }
  };

  if (!cart || cart.length === 0)
    return (
      <section className="text-center p-5">
        <h3>Your cart is empty</h3>
        <button className="btn btn-primary mt-3" onClick={() => navigate("/")}>
          Go Shopping
        </button>
      </section>
    );

  return (
    <div className="container py-5 checkout-wrapper">
      <div className="row mb-4 text-center">
        <div className="col">
          <h2>Checkout</h2>
          <p>Review your order and enter shipping details.</p>
        </div>
      </div>

      <div className="row">
        {/* ---------- REVIEW ORDER ---------- */}
        <div className="col-md-6">
          <div className="card shadow-sm mb-4">
            <div className="card-header bg-primary text-white">
              Review Order
            </div>
            <div className="card-body">
              {cart.map((item, idx) => (
                <div key={idx} className="d-flex mb-3 align-items-center">
                  <img
                    src={
                      item.pic
                        ? `${API_BASE}${
                            item.pic.startsWith("/uploads/")
                              ? item.pic
                              : `/uploads/${item.pic}`
                          }`
                        : "/placeholder.png"
                    }
                    alt={item.name}
                    className="img-thumbnail me-3"
                    style={{ width: "70px", height: "70px", objectFit: "cover" }}
                  />
                  <div className="flex-grow-1">
                    <div className="fw-bold">{item.name}</div>
                    <div>Qty: {item.qty}</div>
                  </div>
                  <div className="fw-bold">${(item.price * item.qty).toFixed(2)}</div>
                </div>
              ))}
              <hr />
              <div className="d-flex justify-content-between">
                <span>Subtotal:</span>
                <strong>${subTotal.toFixed(2)}</strong>
              </div>
              <div className="d-flex justify-content-between">
                <span>Tax (12%):</span>
                <strong>${tax.toFixed(2)}</strong>
              </div>
              <div className="d-flex justify-content-between mt-2">
                <span className="fw-bold">Total:</span>
                <strong className="fs-5">${total.toFixed(2)}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* ---------- SHIPPING & PAYMENT ---------- */}
        <div className="col-md-6">
          <form onSubmit={handlePlaceOrder} className="card shadow-sm">
            <div className="card-header bg-primary text-white">Shipping Info</div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-12">
                  <input
                    type="text"
                    name="country"
                    placeholder="Country"
                    className="form-control"
                    value={form.country}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <input
                    type="text"
                    name="first_name"
                    placeholder="First Name"
                    className="form-control"
                    value={form.first_name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <input
                    type="text"
                    name="last_name"
                    placeholder="Last Name"
                    className="form-control"
                    value={form.last_name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="col-md-12">
                  <input
                    type="text"
                    name="address"
                    placeholder="Address"
                    className="form-control"
                    value={form.address}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <input
                    type="text"
                    name="city"
                    placeholder="City"
                    className="form-control"
                    value={form.city}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <input
                    type="text"
                    name="state"
                    placeholder="State"
                    className="form-control"
                    value={form.state}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <input
                    type="text"
                    name="zip_code"
                    placeholder="Zip Code"
                    className="form-control"
                    value={form.zip_code}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <input
                    type="text"
                    name="phone_number"
                    placeholder="Phone Number"
                    className="form-control"
                    value={form.phone_number}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="col-md-12">
                  <input
                    type="email"
                    name="email_address"
                    placeholder="Email Address"
                    className="form-control"
                    value={form.email_address}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              <hr />
              <button type="submit" className="btn btn-success w-100 mt-3">
                Place Order
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
