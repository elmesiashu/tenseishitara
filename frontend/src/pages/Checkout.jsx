import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = process.env.REACT_APP_API_URL || window.location.origin;

// Helper: get full image URL from backend /uploads
function getImageUrl(filename) {
  if (!filename || typeof filename !== "string" || filename.trim() === "")
    return "/images/placeholder.png";
  return filename.startsWith("/uploads/")
    ? `${API_BASE}${filename}`
    : `${API_BASE}/uploads/${filename}`;
}

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

  // Toggle for adding new
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [showNewPayment, setShowNewPayment] = useState(false);

  // New address & payment (added cvv)
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
    cvv: "",
    expiryDate: "",
    is_primary: false,
  });

  // Editing
  const [editingAddressID, setEditingAddressID] = useState(null);
  const [editingPaymentID, setEditingPaymentID] = useState(null);

  // Loading & errors
  const [loadingAddress, setLoadingAddress] = useState(false);
  const [loadingPayment, setLoadingPayment] = useState(false);
  const [orderLoading, setOrderLoading] = useState(false);
  const [addressError, setAddressError] = useState("");
  const [paymentError, setPaymentError] = useState("");
  const [orderError, setOrderError] = useState("");

  // Country/state/city data
  const countryStateData = {
    "United States": {
      California: ["Los Angeles", "San Francisco", "San Diego"],
      "New York": ["New York City", "Buffalo", "Rochester"],
      Texas: ["Houston", "Dallas", "Austin"],
      Florida: ["Miami", "Orlando", "Tampa"],
    },
    Canada: {
      Alberta: ["Calgary", "Edmonton"],
      Ontario: ["Toronto", "Ottawa", "Hamilton"],
      Quebec: ["Montreal", "Quebec City"],
    },
    India: {
      Maharashtra: ["Mumbai", "Pune", "Nagpur"],
      Delhi: ["New Delhi"],
      Karnataka: ["Bangalore", "Mysore"],
    },
  };

  const [countries] = useState(Object.keys(countryStateData));
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);

  // Capitalize helper
  const capitalize = (str) =>
    str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : "";

  // Prefill full name
  useEffect(() => {
    if (user?.fname && user?.lname) {
      const fullName = `${capitalize(user.fname)} ${capitalize(user.lname)}`;
      setNewAddress((prev) => ({ ...prev, fullName }));
    }
  }, [user]);

  // Load cart session
  useEffect(() => {
    const saved =
      JSON.parse(sessionStorage.getItem("checkoutCart")) || { cart: [], totals: {} };
    setCart(saved.cart || []);
    setSubTotal(saved.totals?.price || 0);
    setTax(saved.totals?.tax || 0);
    setTotal(saved.totals?.total || 0);
  }, []);

  // Update states when country changes
  useEffect(() => {
    if (newAddress.country) {
      const stateList = Object.keys(countryStateData[newAddress.country] || {});
      setStates(stateList);
      if (stateList.length) {
        const cityList =
          countryStateData[newAddress.country][stateList[0]] || [];
        setCities(cityList);
        setNewAddress((prev) => ({
          ...prev,
          state: stateList[0],
          city: cityList[0] || "",
        }));
      }
    } else {
      setStates([]);
      setCities([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newAddress.country]);

  // Update cities when state changes
  useEffect(() => {
    if (newAddress.country && newAddress.state) {
      const cityList =
        countryStateData[newAddress.country][newAddress.state] || [];
      setCities(cityList);
      if (!cityList.includes(newAddress.city)) {
        setNewAddress((prev) => ({ ...prev, city: cityList[0] || "" }));
      }
    } else setCities([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newAddress.state]);

  // Fetch addresses & payments
  useEffect(() => {
    if (!user?.userID) return;

    const fetchAddresses = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/addresses`, {
          credentials: "include",
        });
        const data = await res.json();
        setAddresses(data);
        if (!data.length) setSelectedAddressID("new");
        else
          setSelectedAddressID(
            data.find((a) => a.is_primary)?.addressID || data[0].addressID
          );
      } catch (err) {
        console.error("Failed fetching addresses", err);
      }
    };

    const fetchPayments = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/payments`, {
          credentials: "include",
        });
        const data = await res.json();
        setPayments(data);
        if (!data.length) setSelectedPaymentID("new");
        else
          setSelectedPaymentID(
            data.find((p) => p.is_primary)?.paymentID || data[0].paymentID
          );
      } catch (err) {
        console.error("Failed fetching payments", err);
      }
    };

    fetchAddresses();
    fetchPayments();
  }, [user]);

  // Input handlers
  const handleNewAddressChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewAddress((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleNewPaymentChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === "cardNum") {
      const cleaned = value.replace(/\D/g, "").slice(0, 16);
      setNewPayment((prev) => ({ ...prev, cardNum: cleaned }));
    } else if (name === "cvv") {
      const cleaned = value.replace(/\D/g, "").slice(0, 4); // allow up to 4 just in case (Amex), but we only accept Visa/MC (3)
      setNewPayment((prev) => ({ ...prev, cvv: cleaned }));
    } else
      setNewPayment((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
  };

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

  // ----------------- API OPERATIONS -----------------
  const saveNewAddress = async () => {
    setAddressError("");
    const { fullName, country, address, city, state, zipCode, phoneNum } =
      newAddress;
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
      const addrRes = await fetch(`${API_BASE}/api/addresses`, {
        credentials: "include",
      });
      setAddresses(await addrRes.json());
      setSelectedAddressID(data.addressID);
      setNewAddress({
        fullName: newAddress.fullName,
        country: newAddress.country,
        address: "",
        unit: "",
        city: "",
        state: "",
        zipCode: "",
        phoneNum: "",
        is_primary: false,
      });
      setShowNewAddress(false);
      setLoadingAddress(false);
      return data.addressID;
    } catch (err) {
      setAddressError("Error saving address.");
      setLoadingAddress(false);
      return null;
    }
  };

  const deleteAddress = async (id) => {
    if (!window.confirm("Are you sure you want to delete this address?")) return;
    try {
      await fetch(`${API_BASE}/api/addresses/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const res = await fetch(`${API_BASE}/api/addresses`, {
        credentials: "include",
      });
      setAddresses(await res.json());
    } catch (err) {
      console.error("Error deleting address:", err);
    }
  };

  // Save new payment with CVV + card type validation (Visa or MasterCard only)
  const saveNewPayment = async () => {
    setPaymentError("");
    const { cardName, cardNum, cvv, expiryDate, is_primary } = newPayment;
    // basic presence checks
    if (!cardName || !cardNum || !cvv || !expiryDate) {
      setPaymentError("Please fill in all required fields (name, number, CVV, expiry).");
      return null;
    }

    // card type detection
    const isVisa = /^4/.test(cardNum);
    const isMastercard = /^5[1-5]/.test(cardNum);
    if (!isVisa && !isMastercard) {
      setPaymentError("Only Visa and MasterCard cards are accepted.");
      return null;
    }

    // cvv validation: Visa/MC use 3-digit CVV
    if (!/^\d{3}$/.test(cvv)) {
      setPaymentError("CVV must be 3 digits for Visa and MasterCard.");
      return null;
    }

    // card number length
    if (cardNum.length !== 16) {
      setPaymentError("Card number must be 16 digits.");
      return null;
    }

    setLoadingPayment(true);
    try {
      // NOTE: CVV is sensitive. Ensure backend handles it properly (tokenize / don't store in plaintext).
      const payload = { cardName, cardNum, cvv, expiryDate, is_primary };
      const res = await fetch(`${API_BASE}/api/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to save payment");
      const data = await res.json();
      const payRes = await fetch(`${API_BASE}/api/payments`, {
        credentials: "include",
      });
      setPayments(await payRes.json());
      setSelectedPaymentID(data.paymentID);
      setNewPayment({
        cardName: "",
        cardNum: "",
        cvv: "",
        expiryDate: "",
        is_primary: false,
      });
      setShowNewPayment(false);
      setLoadingPayment(false);
      return data.paymentID;
    } catch (err) {
      setPaymentError("Error saving payment.");
      setLoadingPayment(false);
      return null;
    }
  };

  const deletePayment = async (id) => {
    if (!window.confirm("Are you sure you want to delete this payment method?")) return;
    try {
      await fetch(`${API_BASE}/api/payments/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const res = await fetch(`${API_BASE}/api/payments`, {
        credentials: "include",
      });
      setPayments(await res.json());
    } catch (err) {
      console.error("Error deleting payment:", err);
    }
  };

  const setPrimaryAddress = async (id) => {
    await fetch(`${API_BASE}/api/addresses/${id}/primary`, {
      method: "POST",
      credentials: "include",
    });
    const res = await fetch(`${API_BASE}/api/addresses`, {
      credentials: "include",
    });
    setAddresses(await res.json());
  };

  const setPrimaryPayment = async (id) => {
    await fetch(`${API_BASE}/api/payments/${id}/primary`, {
      method: "POST",
      credentials: "include",
    });
    const res = await fetch(`${API_BASE}/api/payments`, {
      credentials: "include",
    });
    setPayments(await res.json());
  };

  const reduceStock = async (products) => {
    for (const prod of products) {
      await fetch(`${API_BASE}/api/products/decrement-stock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productID: prod.id ?? prod.productID,
          quantity: prod.qty,
        }),
      });
    }
  };

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
      const orderData = {
        userID: user.userID,
        items: cart,
        addressID: addressIDToUse,
        paymentID: paymentIDToUse,
        total,
      };
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
      setOrderError("Failed to place order.");
    } finally {
      setOrderLoading(false);
    }
  };

  const hasValidAddress = selectedAddressID && selectedAddressID !== "";
  const hasValidPayment = selectedPaymentID && selectedPaymentID !== "";

  // ------------------- JSX -------------------
  return (
    <div className="checkout container my-4">
      <h2 className="heading">
        <span>Checkout</span>
      </h2>
      <div className="row">
        {/* LEFT COLUMN */}
        <div className="col-md-6">
          {/* ADDRESS SECTION */}
          <div className="card mb-4 shadow-sm">
            <div className="card-header checkout-section-title text-white">
              Shipping Address
            </div>
            <div className="card-body">
              {addresses.map((a) => (
                <div
                  key={a.addressID}
                  className={`border rounded p-3 mb-2 address-card ${
                    a.is_primary ? "primary" : ""
                  }`}
                >
                  <div>
                    <strong>{a.fullName}</strong>
                    <br />
                    {a.unit && `${a.unit} - `}
                    {a.address}
                    <br />
                    {a.city}, {a.state}, {a.country}
                    <br />
                    {a.zipCode}
                    <br />
                    📞 {a.phoneNum}
                  </div>
                  <div className="mt-2 d-flex justify-content-between align-items-center">
                    <div>
                      <input
                        type="radio"
                        name="address"
                        checked={selectedAddressID === a.addressID}
                        onChange={() => setSelectedAddressID(a.addressID)}
                      />{" "}
                      Select
                      <input
                        type="checkbox"
                        checked={a.is_primary}
                        onChange={() => setPrimaryAddress(a.addressID)}
                        className="ms-2"
                      />{" "}
                      Primary
                    </div>
                    <div>
                      <button
                        className="category-btn"
                        onClick={() => setEditingAddressID(a.addressID)}
                      >
                        Edit
                      </button>
                      <button
                        className="category-btn"
                        onClick={() => deleteAddress(a.addressID)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              <div className="form-check mb-2">
                <input
                  type="checkbox"
                  checked={showNewAddress}
                  onChange={() => setShowNewAddress(!showNewAddress)}
                  className="form-check-input"
                  id="toggleNewAddress"
                />
                <label className="form-check-label" htmlFor="toggleNewAddress">
                  Add New Address
                </label>
              </div>

              {showNewAddress && (
                <div className="border rounded p-3 mt-2 bg-light">
                  {addressError && (
                    <div className="alert alert-danger">{addressError}</div>
                  )}
                  <input
                    type="text"
                    name="fullName"
                    placeholder="Full Name"
                    className="form-control mb-2"
                    value={newAddress.fullName}
                    onChange={handleNewAddressChange}
                  />
                  <select
                    name="country"
                    className="form-select mb-2"
                    value={newAddress.country}
                    onChange={handleNewAddressChange}
                  >
                    {countries.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <select
                    name="state"
                    className="form-select mb-2"
                    value={newAddress.state}
                    onChange={handleNewAddressChange}
                  >
                    {states.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <select
                    name="city"
                    className="form-select mb-2"
                    value={newAddress.city}
                    onChange={handleNewAddressChange}
                  >
                    {cities.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    name="address"
                    placeholder="Address"
                    className="form-control mb-2"
                    value={newAddress.address}
                    onChange={handleNewAddressChange}
                  />
                  <input
                    type="text"
                    name="unit"
                    placeholder="Unit (optional)"
                    className="form-control mb-2"
                    value={newAddress.unit}
                    onChange={handleNewAddressChange}
                  />
                  <input
                    type="text"
                    name="zipCode"
                    placeholder="ZIP Code"
                    className="form-control mb-2"
                    value={newAddress.zipCode}
                    onChange={handleNewAddressChange}
                  />
                  <input
                    type="text"
                    name="phoneNum"
                    placeholder="Phone"
                    className="form-control mb-2"
                    value={newAddress.phoneNum}
                    onChange={handleNewAddressChange}
                  />
                  <div className="form-check mb-2">
                    <input
                      type="checkbox"
                      name="is_primary"
                      checked={newAddress.is_primary}
                      onChange={handleNewAddressChange}
                      className="form-check-input"
                    />
                    <label className="form-check-label">Set as primary</label>
                  </div>
                  <button
                    className="btn btn-success w-100 mt-2"
                    onClick={saveNewAddress}
                    disabled={loadingAddress}
                  >
                    {loadingAddress ? "Saving..." : "Add Address"}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* PAYMENT SECTION */}
          {hasValidAddress && (
            <div className="card mb-4 shadow-sm">
              <div className="card-header checkout-section-title text-white">
                Payment Method
              </div>
              <div className="card-body">
                {payments.map((p) => {
                  const cardNum = p.cardNum || "";
                  const isVisa = /^4/.test(cardNum);
                  const isMastercard = /^5[1-5]/.test(cardNum);
                  const cardImg = isVisa
                    ? getImageUrl("/uploads/visa.png")
                    : isMastercard
                    ? getImageUrl("/uploads/mastercard.png")
                    : null;
                  const cardLabel = isVisa ? "Visa" : isMastercard ? "MasterCard" : "Card";

                  return (
                    <div
                      key={p.paymentID}
                      className={`border rounded p-3 mb-2 payment-card ${
                        p.is_primary ? "primary" : ""
                      }`}
                    >
                      <div className="d-flex align-items-center justify-content-between">
                        <div className="d-flex align-items-center">
                          {cardImg && (
                            <img src={cardImg} alt={cardLabel} width="50" className="me-2" />
                          )}
                          <div>
                            <strong>{p.cardName || "Unnamed Card"}</strong>
                            <br />
                            **** **** **** {cardNum ? cardNum.slice(-4) : "----"}
                            <br />
                            Exp: {p.expiryDate || "N/A"}
                          </div>
                        </div>
                        <div>
                          <input
                            type="radio"
                            name="payment"
                            checked={selectedPaymentID === p.paymentID}
                            onChange={() => setSelectedPaymentID(p.paymentID)}
                          />{" "}
                          Select
                          <input
                            type="checkbox"
                            checked={p.is_primary}
                            onChange={() => setPrimaryPayment(p.paymentID)}
                            className="ms-2"
                          />{" "}
                          Primary
                        </div>
                        <div>
                          <button className="category-btn" onClick={() => setEditingPaymentID(p.paymentID)}>
                            Edit
                          </button>
                          <button className="category-btn" onClick={() => deletePayment(p.paymentID)}>
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                <div className="form-check mb-2">
                  <input
                    type="checkbox"
                    checked={showNewPayment}
                    onChange={() => setShowNewPayment(!showNewPayment)}
                    className="form-check-input"
                    id="toggleNewPayment"
                  />
                  <label className="form-check-label" htmlFor="toggleNewPayment">
                    Add New Payment
                  </label>
                </div>

                {showNewPayment && (
                  <div className="border rounded p-3 mt-2 bg-light">
                    {paymentError && <div className="alert alert-danger">{paymentError}</div>}

                    <input
                      type="text"
                      name="cardName"
                      placeholder="Name on Card"
                      className="form-control mb-2"
                      value={newPayment.cardName}
                      onChange={handleNewPaymentChange}
                    />

                    <input
                      type="text"
                      name="cardNum"
                      placeholder="Card Number (16 digits)"
                      inputMode="numeric"
                      className="form-control mb-2"
                      value={newPayment.cardNum}
                      onChange={handleNewPaymentChange}
                      maxLength={16}
                    />

                    <div className="d-flex gap-2">
                      <input
                        type="month"
                        name="expiryDate"
                        className="form-control mb-2"
                        value={newPayment.expiryDate}
                        onChange={handleNewPaymentChange}
                      />
                      <input
                        type="password"
                        name="cvv"
                        placeholder="CVV"
                        inputMode="numeric"
                        className="form-control mb-2"
                        value={newPayment.cvv}
                        onChange={handleNewPaymentChange}
                        maxLength={3}
                      />
                    </div>

                    <div className="form-check mb-2">
                      <input
                        type="checkbox"
                        name="is_primary"
                        checked={newPayment.is_primary}
                        onChange={handleNewPaymentChange}
                        className="form-check-input"
                      />
                      <label className="form-check-label">Set as primary</label>
                    </div>

                    <button className="btn btn-success w-100 mt-2" onClick={saveNewPayment} disabled={loadingPayment}>
                      {loadingPayment ? "Saving..." : "Add Payment"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN */}
        <div className="col-md-6">
          <div className="card shadow-sm">
            <div className="card-header checkout-section-title text-white">Order Summary</div>
            <div className="card-body">
              {cart.map((item) => (
                <div key={item.id ?? item.productID} className="d-flex justify-content-between border-bottom pb-2 mb-2">
                  <div className="d-flex align-items-center">
                    <img src={getImageUrl(item.image ?? item.pic ?? "")} alt={item.name} width="60" className="me-2 rounded" />
                    <div>
                      <strong>{item.name}</strong> x {item.qty}
                    </div>
                  </div>
                  <div>${(item.price * item.qty).toFixed(2)}</div>
                </div>
              ))}

              <div className="d-flex justify-content-between mt-3">
                <span>Subtotal:</span>
                <strong>${subTotal.toFixed(2)}</strong>
              </div>
              <div className="d-flex justify-content-between">
                <span>Tax:</span>
                <strong>${tax.toFixed(2)}</strong>
              </div>
              <div className="d-flex justify-content-between fs-5 mt-2 border-top pt-2">
                <span>Total:</span>
                <strong>${total.toFixed(2)}</strong>
              </div>

              {orderError && <div className="alert alert-danger mt-3">{orderError}</div>}

              <button className="btn btn-primary w-100 mt-3" onClick={handleMakePayment} disabled={orderLoading || !hasValidAddress || !hasValidPayment}>
                {orderLoading ? "Processing..." : "Place Order"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
