import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

export default function Checkout({ user }) {
  const navigate = useNavigate();

  const [cart, setCart] = useState([]);
  const [subTotal, setSubTotal] = useState(0);
  const [tax, setTax] = useState(0);
  const [total, setTotal] = useState(0);
  const TAX_RATE = 0.12;

  // Addresses & payments from backend
  const [addresses, setAddresses] = useState([]);
  const [payments, setPayments] = useState([]);

  // Selected address/payment (id or "new")
  const [selectedAddressID, setSelectedAddressID] = useState(null);
  const [selectedPaymentID, setSelectedPaymentID] = useState(null);

  // New address form
  const [newAddress, setNewAddress] = useState({
    fullName: "",
    country: "",
    address: "",
    unit: "",
    city: "",
    state: "",
    zipCde: "",
    phoneNum: "",
    is_primary: false,
  });

  // New payment form
  const [newPayment, setNewPayment] = useState({
    cardName: "",
    cardNum: "",
    expiryDate: "",
    is_primary: false,
  });

  // States for country/state dropdown (simple example)
  const countryStateData = {
    "United States": ["California", "New York", "Texas", "Florida"],
    Canada: ["Ontario", "Quebec", "Alberta", "British Columbia"],
    India: ["Maharashtra", "Delhi", "Karnataka", "Tamil Nadu"],
  };
  const [countries] = useState(Object.keys(countryStateData));
  const [states, setStates] = useState([]);

  // Helpers for loading user data
  const fetchAddresses = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/addresses/${user.id}`);
      const data = await res.json();
      setAddresses(data);
      // Select primary if exists
      const primary = data.find((a) => a.is_primary);
      setSelectedAddressID(primary ? primary.addressID : data[0]?.addressID || "new");
    } catch (e) {
      console.error("Failed to fetch addresses", e);
    }
  };

  const fetchPayments = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/payments/${user.id}`);
      const data = await res.json();
      setPayments(data);
      const primary = data.find((p) => p.is_primary);
      setSelectedPaymentID(primary ? primary.paymentID : data[0]?.paymentID || "new");
    } catch (e) {
      console.error("Failed to fetch payments", e);
    }
  };

  // Calculate totals from cart
  useEffect(() => {
    const saved = JSON.parse(sessionStorage.getItem("checkoutCart"));
    if (saved) {
      setCart(saved.cart || []);
      setSubTotal(saved.totals?.price || 0);
      setTax(saved.totals?.tax || 0);
      setTotal(saved.totals?.total || 0);
    }
  }, []);

  // Load addresses and payments on mount
  useEffect(() => {
    if (user?.id) {
      fetchAddresses();
      fetchPayments();
    }
  }, [user]);

  // Update states dropdown on country change (newAddress form)
  useEffect(() => {
    if (newAddress.country) {
      setStates(countryStateData[newAddress.country] || []);
    } else {
      setStates([]);
    }
  }, [newAddress.country]);

  // Handle new address form change
  const handleNewAddressChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewAddress((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Handle new payment form change
  const handleNewPaymentChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewPayment((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Save new address to backend
  const saveNewAddress = async () => {
    // Simple validation
    const {
      fullName,
      country,
      address,
      city,
      state,
      zipCde,
      phoneNum,
    } = newAddress;

    if (!fullName || !country || !address || !city || !state || !zipCde || !phoneNum) {
      alert("Please fill in all required address fields.");
      return null;
    }

    try {
      const res = await fetch(`${API_BASE}/api/addresses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newAddress, userID: user.id }),
      });
      if (!res.ok) throw new Error("Failed to save address");
      const data = await res.json();
      await fetchAddresses();
      setSelectedAddressID(data.addressID);
      return data.addressID;
    } catch (e) {
      alert("Error saving address");
      console.error(e);
      return null;
    }
  };

  // Save new payment card to backend
  const saveNewPayment = async () => {
    const { cardName, cardNum, expiryDate } = newPayment;
    if (!cardName || !cardNum || !expiryDate) {
      alert("Please fill in all required payment fields.");
      return null;
    }
    // Basic card number length check
    if (cardNum.length < 12) {
      alert("Invalid card number");
      return null;
    }

    try {
      const payload = {
        userID: user.id,
        cardName,
        cardNum_last4: cardNum.slice(-4),
        expiryDate,
        is_primary: newPayment.is_primary,
      };

      const res = await fetch(`${API_BASE}/api/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to save payment");
      const data = await res.json();
      await fetchPayments();
      setSelectedPaymentID(data.paymentID);
      return data.paymentID;
    } catch (e) {
      alert("Error saving payment");
      console.error(e);
      return null;
    }
  };

  // Handle making the order
  const handleMakePayment = async (e) => {
    e.preventDefault();

    if (!cart || cart.length === 0) {
      alert("Your cart is empty.");
      return;
    }

    let addressIDToUse = selectedAddressID;
    if (selectedAddressID === "new") {
      // Save new address first
      const newID = await saveNewAddress();
      if (!newID) return; // error saving
      addressIDToUse = newID;
    }

    let paymentIDToUse = selectedPaymentID;
    if (selectedPaymentID === "new") {
      // Save new payment first
      const newID = await saveNewPayment();
      if (!newID) return; // error saving
      paymentIDToUse = newID;
    }

    // Place order
    try {
      const orderData = {
        userID: user.id,
        items: cart,
        addressID: addressIDToUse,
        paymentID: paymentIDToUse,
        total,
      };

      const res = await fetch(`${API_BASE}/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });

      if (!res.ok) throw new Error("Failed to place order");

      sessionStorage.removeItem("checkoutCart");
      navigate("/thankyou");
    } catch (err) {
      console.error(err);
      alert("There was an error placing your order.");
    }
  };

  // If cart empty, redirect or show message
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
      <h2 className="mb-4">Checkout</h2>

      {/* Order Summary */}
      <div className="card mb-4 shadow-sm">
        <div className="card-header bg-primary text-white">Review Order</div>
        <div className="card-body">
          {cart.map((item, i) => (
            <div key={i} className="d-flex mb-3 align-items-center">
              <img
                src={
                  item.pic
                    ? `${API_BASE}${item.pic.startsWith("/uploads/") ? item.pic : `/uploads/${item.pic}`}`
                    : "/placeholder.png"
                }
                alt={item.name}
                className="img-thumbnail me-3"
                style={{ width: "8rem", height: "8rem", objectFit: "cover" }}
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

      {/* Addresses Section */}
      <div className="card mb-4 shadow-sm">
        <div className="card-header bg-info text-white">Shipping Address</div>
        <div className="card-body">
          {addresses.length > 0 && (
            <>
              {addresses.map((addr) => (
                <div key={addr.addressID} className="form-check mb-2">
                  <input
                    className="form-check-input"
                    type="radio"
                    id={`addr-${addr.addressID}`}
                    name="address"
                    value={addr.addressID}
                    checked={selectedAddressID === addr.addressID}
                    onChange={() => setSelectedAddressID(addr.addressID)}
                  />
                  <label className="form-check-label" htmlFor={`addr-${addr.addressID}`}>
                    <strong>{addr.fullName}</strong>, {addr.address}
                    {addr.unit ? `, Unit ${addr.unit}` : ""}, {addr.city}, {addr.state} {addr.zipCde},{" "}
                    {addr.country} — {addr.phoneNum} {addr.is_primary ? "(Primary)" : ""}
                  </label>
                </div>
              ))}
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="radio"
                  id="addr-new"
                  name="address"
                  value="new"
                  checked={selectedAddressID === "new"}
                  onChange={() => setSelectedAddressID("new")}
                />
                <label className="form-check-label" htmlFor="addr-new">
                  Add New Address
                </label>
              </div>
            </>
          )}

          {selectedAddressID === "new" && (
            <form
              className="mt-3"
              onSubmit={(e) => {
                e.preventDefault();
                saveNewAddress();
              }}
            >
              <div className="row g-3">
                <div className="col-md-6">
                  <label htmlFor="fullName" className="form-label">
                    Full Name *
                  </label>
                  <input
                    required
                    type="text"
                    className="form-control"
                    id="fullName"
                    name="fullName"
                    value={newAddress.fullName}
                    onChange={handleNewAddressChange}
                  />
                </div>
                <div className="col-md-6">
                  <label htmlFor="country" className="form-label">
                    Country *
                  </label>
                  <select
                    required
                    className="form-select"
                    id="country"
                    name="country"
                    value={newAddress.country}
                    onChange={handleNewAddressChange}
                  >
                    <option value="">Choose...</option>
                    {countries.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-12">
                  <label htmlFor="address" className="form-label">
                    Address *
                  </label>
                  <input
                    required
                    type="text"
                    className="form-control"
                    id="address"
                    name="address"
                    value={newAddress.address}
                    onChange={handleNewAddressChange}
                    placeholder="Street address"
                  />
                </div>
                <div className="col-md-4">
                  <label htmlFor="unit" className="form-label">
                    Unit
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="unit"
                    name="unit"
                    value={newAddress.unit}
                    onChange={handleNewAddressChange}
                    placeholder="Apartment, suite, etc."
                  />
                </div>
                <div className="col-md-4">
                  <label htmlFor="city" className="form-label">
                    City *
                  </label>
                  <input
                    required
                    type="text"
                    className="form-control"
                    id="city"
                    name="city"
                    value={newAddress.city}
                    onChange={handleNewAddressChange}
                  />
                </div>
                <div className="col-md-4">
                  <label htmlFor="state" className="form-label">
                    State *
                  </label>
                  <select
                    required
                    className="form-select"
                    id="state"
                    name="state"
                    value={newAddress.state}
                    onChange={handleNewAddressChange}
                  >
                    <option value="">Choose...</option>
                    {states.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-6">
                  <label htmlFor="zipCde" className="form-label">
                    Zip Code *
                  </label>
                  <input
                    required
                    type="text"
                    className="form-control"
                    id="zipCde"
                    name="zipCde"
                    value={newAddress.zipCde}
                    onChange={handleNewAddressChange}
                  />
                </div>
                <div className="col-md-6">
                  <label htmlFor="phoneNum" className="form-label">
                    Phone Number *
                  </label>
                  <input
                    required
                    type="tel"
                    className="form-control"
                    id="phoneNum"
                    name="phoneNum"
                    value={newAddress.phoneNum}
                    onChange={handleNewAddressChange}
                  />
                </div>
                <div className="col-12 form-check mt-2">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="addressPrimary"
                    name="is_primary"
                    checked={newAddress.is_primary}
                    onChange={handleNewAddressChange}
                  />
                  <label className="form-check-label" htmlFor="addressPrimary">
                    Set as Primary Address
                  </label>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Payments Section */}
      <div className="card mb-4 shadow-sm">
        <div className="card-header bg-info text-white">Payment Method</div>
        <div className="card-body">
          {payments.length > 0 && (
            <>
              {payments.map((pay) => (
                <div key={pay.paymentID} className="form-check mb-2">
                  <input
                    className="form-check-input"
                    type="radio"
                    id={`pay-${pay.paymentID}`}
                    name="payment"
                    value={pay.paymentID}
                    checked={selectedPaymentID === pay.paymentID}
                    onChange={() => setSelectedPaymentID(pay.paymentID)}
                  />
                  <label className="form-check-label" htmlFor={`pay-${pay.paymentID}`}>
                    {pay.cardName} ending in {pay.cardNum_last4} {pay.is_primary ? "(Primary)" : ""}
                  </label>
                </div>
              ))}
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="radio"
                  id="pay-new"
                  name="payment"
                  value="new"
                  checked={selectedPaymentID === "new"}
                  onChange={() => setSelectedPaymentID("new")}
                />
                <label className="form-check-label" htmlFor="pay-new">
                  Add New Payment Method
                </label>
              </div>
            </>
          )}

          {selectedPaymentID === "new" && (
            <form
              className="mt-3"
              onSubmit={(e) => {
                e.preventDefault();
                saveNewPayment();
              }}
            >
              <div className="row g-3">
                <div className="col-md-6">
                  <label htmlFor="cardName" className="form-label">
                    Name on Card *
                  </label>
                  <input
                    required
                    type="text"
                    className="form-control"
                    id="cardName"
                    name="cardName"
                    value={newPayment.cardName}
                    onChange={handleNewPaymentChange}
                  />
                </div>
                <div className="col-md-6">
                  <label htmlFor="cardNum" className="form-label">
                    Card Number *
                  </label>
                  <input
                    required
                    type="text"
                    maxLength={16}
                    minLength={12}
                    className="form-control"
                    id="cardNum"
                    name="cardNum"
                    value={newPayment.cardNum}
                    onChange={handleNewPaymentChange}
                    placeholder="1234 5678 9012 3456"
                  />
                </div>
                <div className="col-md-6">
                  <label htmlFor="expiryDate" className="form-label">
                    Expiry Date *
                  </label>
                  <input
                    required
                    type="month"
                    className="form-control"
                    id="expiryDate"
                    name="expiryDate"
                    value={newPayment.expiryDate}
                    onChange={handleNewPaymentChange}
                    min={new Date().toISOString().slice(0, 7)} // disallow past expiry
                  />
                </div>
                <div className="col-md-6 form-check d-flex align-items-center">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="paymentPrimary"
                    name="is_primary"
                    checked={newPayment.is_primary}
                    onChange={handleNewPaymentChange}
                  />
                  <label className="form-check-label ms-2" htmlFor="paymentPrimary">
                    Set as Primary Payment
                  </label>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>

      <button className="btn btn-success btn-lg w-100" onClick={handleMakePayment}>
        Make Payment
      </button>
    </div>
  );
}
