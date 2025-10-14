import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = process.env.REACT_APP_API_URL || window.location.origin;

function getImageUrl(filename) {
  if (!filename || typeof filename !== "string" || filename.trim() === "") return "/images/placeholder.png";
  if (filename.startsWith("http")) return filename;
  if (filename.startsWith("/uploads/")) return `${API_BASE}${filename}`;
  return `${API_BASE}/uploads/${filename}`;
}

export default function Checkout({ user }) {
  const navigate = useNavigate();

  // Cart & totals
  const [cart, setCart] = useState([]);
  const [subTotal, setSubTotal] = useState(0);
  const [tax, setTax] = useState(0);
  const [total, setTotal] = useState(0);

  // Addresses & Payments
  const [addresses, setAddresses] = useState([]);
  const [payments, setPayments] = useState([]);
  const [selectedAddressID, setSelectedAddressID] = useState(null);
  const [selectedPaymentID, setSelectedPaymentID] = useState(null);

  const [showNewAddress, setShowNewAddress] = useState(false);
  const [showNewPayment, setShowNewPayment] = useState(false);

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
    cardType: "",
  });

  const [loadingAddress, setLoadingAddress] = useState(false);
  const [loadingPayment, setLoadingPayment] = useState(false);
  const [orderLoading, setOrderLoading] = useState(false);

  const [addressError, setAddressError] = useState("");
  const [paymentError, setPaymentError] = useState("");
  const [orderError, setOrderError] = useState("");

  // Country/State/City data
  const countryStateData = {
    "United States": {
      California: ["Los Angeles", "San Francisco", "San Diego", "Sacramento", "San Jose"],
      "New York": ["New York City", "Buffalo", "Rochester", "Albany", "Syracuse"],
      Texas: ["Houston", "Dallas", "Austin", "San Antonio", "Fort Worth"],
      Florida: ["Miami", "Orlando", "Tampa", "Jacksonville", "Tallahassee"],
      Illinois: ["Chicago", "Springfield", "Aurora", "Naperville", "Peoria"],
      Pennsylvania: ["Philadelphia", "Pittsburgh", "Harrisburg", "Allentown", "Erie"]
    },
    Canada: {
      Alberta: ["Calgary", "Edmonton", "Red Deer", "Lethbridge", "St. Albert"],
      "British Columbia": ["Vancouver", "Victoria", "Surrey", "Burnaby", "Kelowna", "Richmond",
          "Abbotsford", "Coquitlam", "Kamloops", "Nanaimo", "Langley", "Port Coquitlam"],
      Manitoba: ["Winnipeg", "Brandon", "Thompson", "Portage la Prairie", "Selkirk"],
      Ontario: ["Toronto", "Ottawa", "Hamilton", "London", "Kitchener"],
      Quebec: ["Montreal", "Quebec City", "Laval", "Gatineau", "Longueuil"]
    },
    India: {
      Maharashtra: ["Mumbai", "Pune", "Nagpur", "Nashik", "Aurangabad"],
      Delhi: ["New Delhi", "Dwarka", "Rohini", "Karol Bagh", "Connaught Place"],
      Karnataka: ["Bangalore", "Mysore", "Mangalore", "Hubli", "Belgaum"]
    }
  };

  const [countries] = useState(Object.keys(countryStateData));
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);

  const capitalize = (str) => (str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : "");

  // Prefill full name
  useEffect(() => {
    if (user?.fname && user?.lname) {
      setNewAddress((prev) => ({ ...prev, fullName: `${capitalize(user.fname)} ${capitalize(user.lname)}` }));
    }
  }, [user]);

  const [siteDiscount, setSiteDiscount] = useState(0);
  
  // Load cart from sessionStorage
  useEffect(() => {
    const stored = JSON.parse(sessionStorage.getItem("checkoutCart") || "{}");
    const discount = stored.siteDiscount || 0; // temp local
    setSiteDiscount(discount); // update state

    if (stored?.cart?.length) {
      setCart(stored.cart);

      let subtotal = 0;
      stored.cart.forEach(item => {
        const price = Number(item.price) || 0;
        const discounted = price * (1 - discount / 100); // use temp local
        subtotal += discounted * (Number(item.qty) || 1);
      });

      const tax = subtotal * 0.12;
      setSubTotal(subtotal);
      setTax(tax);
      setTotal(subtotal + tax);
    }
  }, []);


  // Update states & cities when country/state changes
  useEffect(() => {
    if (newAddress.country) {
      const stateList = Object.keys(countryStateData[newAddress.country] || {});
      setStates(stateList);
      const cityList =
        stateList.length > 0
          ? countryStateData[newAddress.country][stateList[0]] || []
          : [];
      setCities(cityList);
      setNewAddress((prev) => ({
        ...prev,
        state: stateList[0] || "",
        city: cityList[0] || "",
      }));
    }
  }, [newAddress.country]);

  useEffect(() => {
    if (newAddress.country && newAddress.state) {
      const cityList =
        countryStateData[newAddress.country][newAddress.state] || [];
      setCities(cityList);
      if (!cityList.includes(newAddress.city))
        setNewAddress((prev) => ({
          ...prev,
          city: cityList[0] || "",
        }));
    }
  }, [newAddress.state]);

  // Fetch addresses & payments
  useEffect(() => {
    if (!user?.userID) return;

    const fetchData = async () => {
      try {
        const addrRes = await fetch(`${API_BASE}/api/addresses`, {
          credentials: "include",
        });
        const addrData = await addrRes.json();
        setAddresses(addrData);
        setSelectedAddressID(
          addrData.find((a) => a.is_primary)?.addressID ||
            addrData[0]?.addressID ||
            null
        );

        const payRes = await fetch(`${API_BASE}/api/payments`, {
          credentials: "include",
        });
        const payData = await payRes.json();
        setPayments(payData);
        setSelectedPaymentID(
          payData.find((p) => p.is_primary)?.paymentID ||
            payData[0]?.paymentID ||
            null
        );

        if (!addrData.length) setShowNewAddress(true);
        if (!payData.length) setShowNewPayment(true);
      } catch (err) {
        console.error(err);
      }
    };

    fetchData();
  }, [user?.userID]);

  const handleNewAddressChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewAddress((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleNewPaymentChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === "cardNum")
      setNewPayment((prev) => ({
        ...prev,
        cardNum: value.replace(/\D/g, "").slice(0, 16),
      }));
    else if (name === "cvv")
      setNewPayment((prev) => ({
        ...prev,
        cvv: value.replace(/\D/g, "").slice(0, 3),
      }));
    else
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

  // ----- Address/Payment CRUD -----
  const saveNewAddress = async () => {
    setAddressError("");
    const { fullName, country, address, city, state, zipCode, phoneNum } = newAddress;
    if (!fullName || !country || !address || !city || !state || !zipCode || !phoneNum) return setAddressError("Please fill in all required fields.");
    if (!isValidZip(zipCode, country)) return setAddressError(`Invalid ZIP/Postal Code for ${country}.`);

    setLoadingAddress(true);
    try {
      const res = await fetch(`${API_BASE}/api/addresses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(newAddress),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      const addrRes = await fetch(`${API_BASE}/api/addresses`, { credentials: "include" });
      setAddresses(await addrRes.json());
      setSelectedAddressID(data.addressID);
      setNewAddress({ ...newAddress, address: "", unit: "", zipCode: "", phoneNum: "", is_primary: false });
      setShowNewAddress(false);
      setShowNewPayment(true);
      return data.addressID;
    } catch {
      setAddressError("Error saving address.");
    } finally {
      setLoadingAddress(false);
    }
  };

  const saveNewPayment = async () => {
    setPaymentError("");
    const { cardName, cardNum, cvv, expiryDate } = newPayment;
    if (!cardName || !cardNum || !cvv || !expiryDate) return setPaymentError("Please fill in all required fields.");

    const isVisa = /^4/.test(cardNum);
    const isMastercard = /^5[1-5]/.test(cardNum);
    if (!isVisa && !isMastercard) return setPaymentError("Only Visa and MasterCard cards are accepted.");
    if (cvv.length !== 3 || cardNum.length !== 16) return setPaymentError("Invalid CVV or card number.");

    setLoadingPayment(true);
    try {
      const payload = { ...newPayment, cardType: isVisa ? "Visa" : "MasterCard" };
      const res = await fetch(`${API_BASE}/api/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      const payRes = await fetch(`${API_BASE}/api/payments`, { credentials: "include" });
      setPayments(await payRes.json());
      setSelectedPaymentID(data.paymentID);
      setNewPayment({ cardName: "", cardNum: "", cvv: "", expiryDate: "", is_primary: false, cardType: "" });
      setShowNewPayment(false);
      return data.paymentID;
    } catch {
      setPaymentError("Error saving payment.");
    } finally {
      setLoadingPayment(false);
    }
  };

  const deleteAddress = async (id) => {
    await fetch(`${API_BASE}/api/addresses/${id}`, { method: "DELETE", credentials: "include" });
    const res = await fetch(`${API_BASE}/api/addresses`, { credentials: "include" });
    setAddresses(await res.json());
  };

  const deletePayment = async (id) => {
    await fetch(`${API_BASE}/api/payments/${id}`, { method: "DELETE", credentials: "include" });
    const res = await fetch(`${API_BASE}/api/payments`, { credentials: "include" });
    setPayments(await res.json());
  };

  const setPrimaryAddress = async (id) => {
    await fetch(`${API_BASE}/api/addresses/${id}/primary`, { method: "POST", credentials: "include" });
    const res = await fetch(`${API_BASE}/api/addresses`, { credentials: "include" });
    setAddresses(await res.json());
  };

  const setPrimaryPayment = async (id) => {
    await fetch(`${API_BASE}/api/payments/${id}/primary`, { method: "POST", credentials: "include" });
    const res = await fetch(`${API_BASE}/api/payments`, { credentials: "include" });
    setPayments(await res.json());
  };

  const reduceStock = async (products) => {
    for (const prod of products) {
      await fetch(`${API_BASE}/api/products/decrement-stock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productID: prod.id ?? prod.productID, quantity: prod.qty }),
      });
    }
  };

  // --- Place Order ---
  const handleMakePayment = async (e) => {
    e.preventDefault();
    setOrderError("");
    setOrderLoading(true);

    if (!cart.length) {
      setOrderError("Your cart is empty.");
      setOrderLoading(false);
      return;
    }

    try {
      // Format cart items for backend
      const formattedCart = cart.map((item) => {
        const productID =
          item.productID ||
          item.id ||
          (item.key ? parseInt(item.key.split("-")[0], 10) : null);

        if (!productID) {
          console.warn("Missing productID for cart item:", item);
        }

        const discountedPrice = (Number(item.price) || 0) * (1 - (siteDiscount || 0) / 100);

        return {
          productID,
          name: item.name || item.title || item.product_name || "Unnamed Product",
          price: discountedPrice,       // store discounted price
          qty: item.qty ?? item.quantity ?? 1,
          optionName: item.optionName ?? null,
          optionValue: item.optionValue ?? null,
          pic: item.pic ?? item.image ?? null,
        };
      });

      // Calculate subtotal, tax, total
      const subtotal = formattedCart.reduce((acc, i) => acc + i.price * i.qty, 0);
      const taxAmount = subtotal * 0.12;
      const orderTotal = subtotal + taxAmount;

      // Prepare order data to store in DB
      const orderData = {
        userID: user.userID,
        items: formattedCart,
        total: orderTotal,   // <-- correct key
        addressID: selectedAddressID,
        paymentID: selectedPaymentID,
        status: "Order Placed",
        created_at: new Date().toISOString(),
      };

      console.log("Sending order data:", orderData);

      // Send order to backend
      const orderRes = await fetch(`${API_BASE}/api/order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(orderData),
      });

      if (!orderRes.ok) {
        const errorText = await orderRes.text();
        throw new Error(`Order failed: ${errorText}`);
      }

      const data = await orderRes.json();
      console.log("Order success:", data);

      // Clear cart from sessionStorage, localStorage, and state
      sessionStorage.removeItem("checkoutCart");
      localStorage.removeItem("cart");
      if (setCart) setCart([]);

      // Navigate to Thank You page
      navigate("/thankyou", {
        state: {
          orderID: data.orderID,
          items: formattedCart,
          total: orderTotal,    // <-- pass total, not totals
          address: selectedAddressID,
          payment: selectedPaymentID,
          status: "Order Placed",
          created_at: orderData.created_at,
        },
      });
    } catch (err) {
      console.error("Order creation failed:", err);
      setOrderError("Failed to place order. Please try again.");
    } finally {
      setOrderLoading(false);
    }
  };

  const hasValidAddress = selectedAddressID && selectedAddressID !== "";
  const hasValidPayment = selectedPaymentID && selectedPaymentID !== "";

  const sortedAddresses = [...addresses].sort((a, b) => b.is_primary - a.is_primary);
  const sortedPayments = [...payments].sort((a, b) => b.is_primary - a.is_primary);

 return (
  <div className="checkout container my-4">
    <h2 className="heading"><span>Checkout</span></h2>
    <div className="row">
      {/* LEFT COLUMN */}
      <div className="col-md-6">

        {/* --- ADDRESS SECTION --- */}
        <div className="card mb-4 shadow-sm">
          <div className="card-header bg-primary text-white">Shipping Address</div>
          <div className="card-body">
            {sortedAddresses.map((a) => (
              <div key={a.addressID} className={`border p-3 mb-2 rounded ${a.is_primary ? "primary" : ""}`}>
                <div>
                  <strong>{a.fullName}</strong><br />
                  {a.unit && `${a.unit} - `}{a.address}<br />
                  {a.city}, {a.state}<br />
                  {a.country}, {a.zipCode}<br />
                  {a.phoneNum}
                </div>
                <div className="mt-2 d-flex justify-content-between align-items-center">
                  <div>
                    <input
                      type="radio"
                      name="address"
                      checked={selectedAddressID === a.addressID}
                      onChange={() => {
                        setSelectedAddressID(a.addressID);
                        setShowNewAddress(false); // auto-hide new address form
                      }}
                    /> Select
                    <input
                      type="checkbox"
                      checked={a.is_primary}
                      onChange={() => setPrimaryAddress(a.addressID)}
                      className="ms-2"
                      style={{ accentColor: 'green' }}
                    /> Primary
                  </div>
                  <div>
                    <button className="category-btn me-1" onClick={() => { setNewAddress({ ...a }); setShowNewAddress(true); setSelectedAddressID(a.addressID); }}>Edit</button>
                    <button className="category-btn" onClick={() => deleteAddress(a.addressID)}>Remove</button>
                  </div>
                </div>
              </div>
            ))}
            {/* ADD NEW ADDRESS BUTTON */}
              <div className="form-check mb-2">
                <input type="checkbox" checked={showNewAddress} onChange={() => setShowNewAddress(!showNewAddress)} className="form-check-input" />
                <label className="form-check-label">Add a new address</label>
              </div>
            {/* NEW ADDRESS FORM */}
            {showNewAddress && (
              <div className="border p-3 rounded bg-light">
                {addressError && <div className="alert alert-danger">{addressError}</div>}
                <input type="text" name="fullName" placeholder="Full Name" className="form-control mb-2" value={newAddress.fullName} onChange={handleNewAddressChange} />
                <select name="country" className="form-select mb-2" value={newAddress.country} onChange={handleNewAddressChange}>
                  {countries.map(c => <option key={c}>{c}</option>)}
                </select>
                <select name="state" className="form-select mb-2" value={newAddress.state} onChange={handleNewAddressChange}>
                  {states.map(s => <option key={s}>{s}</option>)}
                </select>
                <select name="city" className="form-select mb-2" value={newAddress.city} onChange={handleNewAddressChange}>
                  {cities.map(c => <option key={c}>{c}</option>)}
                </select>
                <input type="text" name="address" placeholder="Address" className="form-control mb-2" value={newAddress.address} onChange={handleNewAddressChange} />
                <input type="text" name="unit" placeholder="Unit/Suite" className="form-control mb-2" value={newAddress.unit} onChange={handleNewAddressChange} />
                <input type="text" name="zipCode" placeholder="ZIP / Postal Code" className="form-control mb-2" value={newAddress.zipCode} onChange={handleNewAddressChange} />
                <input type="text" name="phoneNum" placeholder="Phone Number" className="form-control mb-2" value={newAddress.phoneNum} onChange={handleNewAddressChange} />
                <div className="form-check mb-2">
                  <input type="checkbox" name="is_primary" checked={newAddress.is_primary} onChange={handleNewAddressChange} className="form-check-input" />
                  <label className="form-check-label">Set as Primary</label>
                </div>
                <button className="btn btn-success w-100" onClick={saveNewAddress} disabled={loadingAddress}>
                  {loadingAddress ? "Saving..." : "Save Address"}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* --- PAYMENT SECTION --- */}
        {hasValidAddress && (
          <div className="card mb-4 shadow-sm">
            <div className="card-header bg-primary text-white">Payment Method</div>
            <div className="card-body">
              {sortedPayments.map((p) => {
                const cardType = (p.cardType || "").toLowerCase();
                const last4 = p.cardNum_last4 || "----";
                const brand = cardType ? cardType.charAt(0).toUpperCase() + cardType.slice(1) : "Card";
                let logoSrc = cardType === "visa" ? "/visa.png" : cardType === "mastercard" ? "/mastercard.png" : null;

                return (
                  <div key={p.paymentID} className={`border p-3 mb-2 rounded d-flex align-items-center ${p.is_primary ? "primary" : ""}`}>
                    <div style={{ width: 50, marginRight: 10 }}>
                      {logoSrc ? <img src={logoSrc} alt={brand} style={{ width: "100%" }} /> : <div style={{ width: 50, height: 36, background: "#f1f1f1", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 4 }}><small>{brand}</small></div>}
                    </div>
                    <div style={{ flex: 1 }}>
                      <strong>{p.cardName || "Cardholder"}</strong> - {brand}<br />
                      **** **** **** {last4}<br />
                      Expires {p.expiryDate || "N/A"}
                    </div>
                    <div className="d-flex flex-column align-items-end">
                      <div className="mb-1">
                        <input
                          type="radio"
                          name="payment"
                          checked={selectedPaymentID === p.paymentID}
                          onChange={() => {
                            setSelectedPaymentID(p.paymentID);
                            setShowNewPayment(false); // auto-hide new payment form
                          }}
                        /> Select
                        <input
                          type="checkbox"
                          checked={Boolean(p.is_primary)}
                          onChange={() => setPrimaryPayment(p.paymentID)}
                          className="ms-2"
                          style={{ accentColor: "green" }}
                        /> Primary
                      </div>
                      <div>
                        <button className="category-btn" onClick={() => deletePayment(p.paymentID)}>Remove</button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* ADD NEW PAYMENT BUTTON */}
                <div className="form-check mb-2">
                  <input type="checkbox" checked={showNewPayment} onChange={() => setShowNewPayment(!showNewPayment)} className="form-check-input" />
                  <label className="form-check-label">Add New Payment</label>
                </div>

              {/* NEW PAYMENT FORM */}
              {showNewPayment && (
                <div className="border p-3 rounded bg-light">
                  {paymentError && <div className="alert alert-danger">{paymentError}</div>}
                  <input type="text" name="cardName" placeholder="Cardholder Name" className="form-control mb-2" value={newPayment.cardName} onChange={handleNewPaymentChange} />
                  <input type="text" name="cardNum" placeholder="Card Number" className="form-control mb-2" value={newPayment.cardNum} onChange={handleNewPaymentChange} />
                  <input type="text" name="expiryDate" placeholder="MM/YYYY" className="form-control mb-2" value={newPayment.expiryDate} onChange={handleNewPaymentChange} />
                  <input type="text" name="cvv" placeholder="CVV" className="form-control mb-2" value={newPayment.cvv} onChange={handleNewPaymentChange} />
                  <div className="form-check mb-2">
                    <input type="checkbox" name="is_primary" checked={newPayment.is_primary} onChange={handleNewPaymentChange} className="form-check-input" />
                    <label className="form-check-label">Set as Primary</label>
                  </div>
                  <button className="btn btn-success w-100" onClick={saveNewPayment} disabled={loadingPayment}>
                    {loadingPayment ? "Saving..." : "Save Payment"}
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
              {cart.map((item) => {
                const discounted = (Number(item.price) || 0) * (1 - (siteDiscount || 0) / 100);
                return (
                  <div key={item.key} className="d-flex justify-content-between border-bottom pb-2 mb-2">
                    <div className="d-flex align-items-center">
                      <img src={getImageUrl(item.pic ?? item.image ?? "")} alt={item.name} width="60" className="me-2 rounded" />
                      <div>
                        <strong>{item.name}</strong> x {item.qty}
                      </div>
                    </div>
                    <div>${(discounted * item.qty).toFixed(2)}</div>
                  </div>
                );
              })}
              <div className="d-flex justify-content-between mt-3">
                <span>Subtotal:</span>
                <strong>${subTotal.toFixed(2)}</strong>
              </div>
              <div className="d-flex justify-content-between">
                <span>Tax (12%):</span>
                <strong>${tax.toFixed(2)}</strong>
              </div>
              <div className="d-flex justify-content-between fs-5 mt-2 border-top pt-2">
                <span>Total:</span>
                <strong>${total.toFixed(2)}</strong>
              </div>

              {orderError && <div className="alert alert-danger mt-3">{orderError}</div>}

              <button className="btn btn-primary w-100 mt-3" onClick={handleMakePayment} disabled={orderLoading || !hasValidAddress || !hasValidPayment}>
                {orderLoading ? "Processing..." : "Proceed to Payment"}
                {console.log("CART DATA:", cart)}
              </button>
            </div>
          </div>
        </div>
    </div>
  </div>
);

}
