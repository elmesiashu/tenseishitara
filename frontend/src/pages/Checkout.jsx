import React, { useState, useEffect,useMemo } from "react";
import { useNavigate } from "react-router-dom";

// Dynamic API base (works both locally and on Vercel)
const API_BASE = process.env.REACT_APP_API_URL || window.location.origin;

// Helper: get full image URL
function getImageUrl(filename) {
  if (!filename || typeof filename !== "string" || filename.trim() === "") return "/images/placeholder.png";
  if (filename.startsWith("http")) return filename;
  if (filename.startsWith("/uploads/")) return `${API_BASE}${filename}`;
  return `${API_BASE}/uploads/${filename}`;
}

// Helper: capitalize
const capitalize = (str) => (str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : "");

export default function Checkout({ user }) {
  const navigate = useNavigate();

  // Cart & totals
  const [cart, setCart] = useState([]);
  const [subTotal, setSubTotal] = useState(0);
  const [tax, setTax] = useState(0);
  const [total, setTotal] = useState(0);
  const TAX_RATE = 0.12;

  // Addresses & payments
  const [addresses, setAddresses] = useState([]);
  const [payments, setPayments] = useState([]);
  const [selectedAddressID, setSelectedAddressID] = useState(null);
  const [selectedPaymentID, setSelectedPaymentID] = useState(null);

  // New address & payment
  const [newAddress, setNewAddress] = useState({
    fullName: "",
    country: "United States",
    address: "",
    unit: "",
    city: "",
    state: "",
    zipCode: "",
    phoneNum: "",
    is_primary: false,
  });

  const [newPayment, setNewPayment] = useState({
    cardName: "",
    cardNum: "",
    expiryDate: "",
    is_primary: false,
  });

  // Loading & errors
  const [loadingAddress, setLoadingAddress] = useState(false);
  const [loadingPayment, setLoadingPayment] = useState(false);
  const [orderLoading, setOrderLoading] = useState(false);
  const [addressError, setAddressError] = useState("");
  const [paymentError, setPaymentError] = useState("");
  const [orderError, setOrderError] = useState("");

  // Countries & states
  const countryStateData = useMemo(() => ({
    "United States": ["California", "New York", "Texas", "Florida"],
    Canada: ["Alberta", "British Columbia", "Manitoba", "New Brunswick", "Nova Scotia", "Ontario", "Prince Edward Island", "Quebec", "Saskatchewan"],
    India: ["Maharashtra", "Delhi", "Karnataka", "Tamil Nadu"],
  }), []);

  const [countries] = useState(Object.keys(countryStateData));
  const [states, setStates] = useState([]);

  // Prefill fullName from user
  useEffect(() => {
    if (user?.fname && user?.lname) {
      setNewAddress((prev) => ({ ...prev, fullName: `${capitalize(user.fname)} ${capitalize(user.lname)}` }));
    }
  }, [user]);

  // Load cart session
  useEffect(() => {
    const saved = JSON.parse(sessionStorage.getItem("checkoutCart")) || { cart: [], totals: {} };
    setCart(saved.cart || []);
    setSubTotal(saved.totals?.price || 0);
    setTax(saved.totals?.tax || 0);
    setTotal(saved.totals?.total || 0);
  }, []);

  // Update states when country changes
  useEffect(() => {
    if (newAddress.country) setStates(countryStateData[newAddress.country] || []);
    else setStates([]);
  }, [newAddress.country, countryStateData]);

  // Detect user location for default country
  useEffect(() => {
    if (!("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${pos.coords.latitude}&longitude=${pos.coords.longitude}&localityLanguage=en`
          );
          const data = await res.json();
          if (data.countryName && countries.includes(data.countryName)) {
            setNewAddress((prev) => ({ ...prev, country: data.countryName }));
          }
        } catch (err) {
          console.error("Failed to detect country", err);
        }
      },
      (err) => console.warn("Geolocation error:", err)
    );
  }, [countries]);


  // Fetch addresses & payments
  useEffect(() => {
    if (!user?.userID) return;

    const fetchAddresses = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/addresses`, { credentials: "include" });
        const data = await res.json();
        setAddresses(data);
        setSelectedAddressID(data.find((a) => a.is_primary)?.addressID || data[0]?.addressID || "new");
      } catch (err) {
        console.error("Failed fetching addresses", err);
      }
    };

    const fetchPayments = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/payments`, { credentials: "include" });
        const data = await res.json();
        setPayments(data);
        setSelectedPaymentID(data.find((p) => p.is_primary)?.paymentID || data[0]?.paymentID || "new");
      } catch (err) {
        console.error("Failed fetching payments", err);
      }
    };

    fetchAddresses();
    fetchPayments();
  }, [user]);

  // Handle input changes
  const handleNewAddressChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewAddress((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    setAddressError("");
  };

  const handleNewPaymentChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewPayment((prev) => ({
      ...prev,
      [name]: name === "cardNum" ? value.replace(/\D/g, "").slice(0, 16) : type === "checkbox" ? checked : value,
    }));
    setPaymentError("");
  };

  // Validate ZIP code
  const isValidZip = (zip, country) => {
    if (!zip) return false;
    zip = zip.trim();
    switch (country) {
      case "United States":
        return /^\d{5}(-\d{4})?$/.test(zip);
      case "Canada":
        return /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/.test(zip);
      default:
        return zip.length >= 3;
    }
  };

  // Save new address
  const saveNewAddress = async () => {
    setAddressError("");
    const { fullName, country, address, city, state, zipCode, phoneNum } = newAddress;
    if (!fullName || !country || !address || !city || !state || !zipCode || !phoneNum) {
      setAddressError("Please fill in all required fields.");
      return null;
    }
    if (!isValidZip(zipCode, country)) {
      setAddressError(`Invalid ZIP/Postal Code for ${country}.`);
      return null;
    }

    setLoadingAddress(true);
    try {
      const res = await fetch(`${API_BASE}/api/addresses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(newAddress),
      });
      if (!res.ok) throw new Error("Failed to save address");
      const data = await res.json();

      const addrRes = await fetch(`${API_BASE}/api/addresses`, { credentials: "include" });
      setAddresses(await addrRes.json());

      setSelectedAddressID(data.addressID);
      setNewAddress((prev) => ({
        ...prev,
        address: "",
        unit: "",
        city: "",
        state: "",
        zipCode: "",
        phoneNum: "",
        is_primary: false,
      }));
      setLoadingAddress(false);
      return data.addressID;
    } catch (err) {
      console.error(err);
      setAddressError("Error saving address.");
      setLoadingAddress(false);
      return null;
    }
  };

  // Save new payment
  const saveNewPayment = async () => {
    setPaymentError("");
    const { cardName, cardNum, expiryDate } = newPayment;
    if (!cardName || !cardNum || !expiryDate) {
      setPaymentError("Please fill in all required payment fields.");
      return null;
    }
    if (cardNum.length < 12) {
      setPaymentError("Invalid card number");
      return null;
    }
    const todayMonth = new Date().toISOString().slice(0, 7);
    if (expiryDate < todayMonth) {
      setPaymentError("Expiry date cannot be in the past");
      return null;
    }

    setLoadingPayment(true);
    try {
      const payload = { cardName, cardNum_last4: cardNum.slice(-4), expiryDate, is_primary: newPayment.is_primary };
      const res = await fetch(`${API_BASE}/api/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to save payment");
      const data = await res.json();

      const payRes = await fetch(`${API_BASE}/api/payments`, { credentials: "include" });
      setPayments(await payRes.json());

      setSelectedPaymentID(data.paymentID);
      setNewPayment({ cardName: "", cardNum: "", expiryDate: "", is_primary: false });
      setLoadingPayment(false);
      return data.paymentID;
    } catch (err) {
      console.error(err);
      setPaymentError("Error saving payment.");
      setLoadingPayment(false);
      return null;
    }
  };

  // Reduce stock per product
  const reduceStock = async (products) => {
    try {
      await Promise.all(
        products.map((prod) =>
          fetch(`${API_BASE}/api/products/decrement-stock`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ productID: prod.id ?? prod.productID, quantity: prod.qty }),
          })
        )
      );
    } catch (err) {
      console.error("Failed to reduce stock", err);
    }
  };

  // Place order
  const handleMakePayment = async (e) => {
    e.preventDefault();
    setOrderError("");
    setOrderLoading(true);

    if (!cart.length) {
      setOrderError("Your cart is empty.");
      setOrderLoading(false);
      return;
    }

    let addressIDToUse = selectedAddressID;
    let paymentIDToUse = selectedPaymentID;

    if (selectedAddressID === "new") {
      const newAddrID = await saveNewAddress();
      if (!newAddrID) return setOrderLoading(false);
      addressIDToUse = newAddrID;
    }
    if (selectedPaymentID === "new") {
      const newPayID = await saveNewPayment();
      if (!newPayID) return setOrderLoading(false);
      paymentIDToUse = newPayID;
    }

    try {
      const orderData = { userID: user.userID, items: cart, addressID: addressIDToUse, paymentID: paymentIDToUse, total };
      const orderRes = await fetch(`${API_BASE}/api/order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(orderData),
      });
      if (!orderRes.ok) throw new Error("Order placement failed");

      await reduceStock(cart);
      sessionStorage.removeItem("checkoutCart");
      navigate("/order-confirmation");
    } catch (err) {
      console.error(err);
      setOrderError("Failed to place order.");
    } finally {
      setOrderLoading(false);
    }
  };

  const hasValidAddress = selectedAddressID && selectedAddressID !== "";
  const hasValidPayment = selectedPaymentID && selectedPaymentID !== "";

  return (
    <div className="checkout container my-4">
      <h2 className="heading"><span>Checkout</span></h2>
      <div className="row">
        {/* LEFT: Shipping & Payment */}
        <div className="col-md-6">
          {/* Shipping Address Card */}
          <div className="card mb-4 shadow-sm">
            <div className="card-header checkout-section-title text-white">Shipping Address</div>
            <div className="card-body">
              {addresses.map((a) => (
                <div key={a.addressID} className={`form-check mb-2 p-2 border rounded ${selectedAddressID === a.addressID ? 'border-primary' : ''}`}>
                  <input type="radio" className="form-check-input" name="address" value={a.addressID} checked={selectedAddressID === a.addressID} onChange={() => setSelectedAddressID(a.addressID)} />
                  <label className="form-check-label">
                    {a.fullName}, {a.address} {a.unit && `, ${a.unit}`}, {a.city}, {a.state}, {a.country}, {a.zipCode}
                  </label>
                  <div>
                    <input type="checkbox" checked={a.is_primary} onChange={async () => {
                      await fetch(`${API_BASE}/api/auth/addresses/${a.addressID}/primary`, { method: "POST", credentials: "include" });
                      const res = await fetch(`${API_BASE}/api/auth/addresses`, { credentials: "include" });
                      setAddresses(await res.json());
                    }} /> Set as primary
                  </div>
                </div>
              ))}

              {/* Add New Address */}
              {(addresses.length === 0 || selectedAddressID === "new") && (
                <div className="border rounded p-3 mt-3 bg-light">
                  {addressError && <div className="alert alert-danger">{addressError}</div>}
                  <input type="text" name="fullName" placeholder="Full Name" className="form-control mb-2" value={newAddress.fullName} onChange={handleNewAddressChange} />
                  <select name="country" className="form-select mb-2" value={newAddress.country} onChange={handleNewAddressChange}>
                    {countries.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <input type="text" name="address" placeholder="Address" className="form-control mb-2" value={newAddress.address} onChange={handleNewAddressChange} />
                  <input type="text" name="unit" placeholder="Unit (optional)" className="form-control mb-2" value={newAddress.unit} onChange={handleNewAddressChange} />
                  <input type="text" name="city" placeholder="City" className="form-control mb-2" value={newAddress.city} onChange={handleNewAddressChange} />
                  <select name="state" className="form-select mb-2" value={newAddress.state} onChange={handleNewAddressChange}>
                    {states.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <input type="text" name="zipCode" placeholder="ZIP Code" className="form-control mb-2" value={newAddress.zipCode} onChange={handleNewAddressChange} />
                  <input type="text" name="phoneNum" placeholder="Phone" className="form-control mb-2" value={newAddress.phoneNum} onChange={handleNewAddressChange} />
                  <div className="form-check mb-2">
                    <input type="checkbox" className="form-check-input" name="is_primary" checked={newAddress.is_primary} onChange={handleNewAddressChange} />
                    <label className="form-check-label">Set as primary</label>
                  </div>
                  <button className="btn btn-success w-100 mt-2" onClick={saveNewAddress} disabled={loadingAddress}>{loadingAddress ? "Saving..." : "Save Address"}</button>
                </div>
              )}
            </div>
          </div>

          {/* Payment Method Card */}
          {hasValidAddress && (
            <div className="card mb-4 shadow-sm">
              <div className="card-header checkout-section-title text-white">Payment Method</div>
              <div className="card-body">
                {payments.map((p) => (
                  <div key={p.paymentID} className={`form-check mb-2 p-2 border rounded ${selectedPaymentID === p.paymentID ? 'border-primary' : ''}`}>
                    <input type="radio" className="form-check-input" name="payment" value={p.paymentID} checked={selectedPaymentID === p.paymentID} onChange={() => setSelectedPaymentID(p.paymentID)} />
                    <label className="form-check-label">{p.cardName} - **** **** **** {p.cardNum_last4} (Exp: {p.expiryDate})</label>
                    <div>
                      <input type="checkbox" checked={p.is_primary} onChange={async () => {
                        await fetch(`${API_BASE}/api/auth/payments/${p.paymentID}/primary`, { method: "POST", credentials: "include" });
                        const res = await fetch(`${API_BASE}/api/auth/payments`, { credentials: "include" });
                        setPayments(await res.json());
                      }} /> Set as primary
                    </div>
                  </div>
                ))}

                {(payments.length === 0 || selectedPaymentID === "new") && (
                  <div className="border rounded p-3 mt-3 bg-light">
                    {paymentError && <div className="alert alert-danger">{paymentError}</div>}
                    <input type="text" name="cardName" placeholder="Name on Card" className="form-control mb-2" value={newPayment.cardName} onChange={handleNewPaymentChange} />
                    <input type="text" name="cardNum" placeholder="Card Number" className="form-control mb-2" value={newPayment.cardNum} onChange={handleNewPaymentChange} />
                    <input type="month" name="expiryDate" placeholder="Expiry Date" className="form-control mb-2" value={newPayment.expiryDate} onChange={handleNewPaymentChange} />
                    <div className="form-check mb-2">
                      <input type="checkbox" name="is_primary" checked={newPayment.is_primary} onChange={handleNewPaymentChange} className="form-check-input" />
                      <label className="form-check-label">Set as primary</label>
                    </div>
                    <button className="btn btn-success w-100 mt-2" onClick={saveNewPayment} disabled={loadingPayment}>{loadingPayment ? "Saving..." : "Save Payment"}</button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: Review Order */}
        <div className="col-md-6">
          <div className="card shadow-sm">
            <div className="card-header checkout-section-title text-white">Review Your Order</div>
            <div className="card-body">
              {cart.map((item) => (
                <div key={item.id || item.productID} className="d-flex justify-content-between align-items-center border-bottom py-2">
                  <div className="d-flex align-items-center">
                    <img src={getImageUrl(item.pic)} alt={item.name} width="50" height="50" className="rounded me-3" />
                    <div><strong>{item.name}</strong> × {item.qty}</div>
                  </div>
                  <span>${(item.price * item.qty).toFixed(2)}</span>
                </div>
              ))}
              <div className="mt-3 border-top pt-3">
                <div className="d-flex justify-content-between mb-2"><strong>Subtotal:</strong> <span>${subTotal.toFixed(2)}</span></div>
                <div className="d-flex justify-content-between mb-2"><strong>Tax ({TAX_RATE * 100}%):</strong> <span>${tax.toFixed(2)}</span></div>
                <div className="d-flex justify-content-between fs-5 border-top pt-2"><strong>Total:</strong> <strong>${total.toFixed(2)}</strong></div>
              </div>
              {orderError && <div className="alert alert-danger mt-3">{orderError}</div>}
              {hasValidAddress && hasValidPayment && (
                <button className="btn btn-primary w-100 mt-3" onClick={handleMakePayment} disabled={orderLoading}>
                  {orderLoading ? "Placing Order..." : "Place Order"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
