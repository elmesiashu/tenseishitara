import React, { useEffect, useState } from "react";
import axios from "axios";
import { Button, Form } from "react-bootstrap";

export default function Payment() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewPayment, setShowNewPayment] = useState(false);
  const [newPayment, setNewPayment] = useState({
    cardName: "",
    cardNum: "",
    expiryDate: "",
    cvv: "",
    is_primary: false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchPayments = async () => {
    try {
      const res = await axios.get("/api/payments");
      const sorted = res.data.sort((a, b) => b.is_primary - a.is_primary);
      setPayments(sorted);
    } catch (err) {
      console.error("Failed to fetch payments", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleDelete = async (paymentID) => {
    try {
      await axios.delete(`/api/payments/${paymentID}`);
      fetchPayments();
    } catch (err) {
      console.error("Failed to delete payment", err);
    }
  };

  const handleSetPrimary = async (paymentID) => {
    try {
      await axios.post(`/api/payments/${paymentID}/primary`);
      fetchPayments();
    } catch (err) {
      console.error("Failed to set primary", err);
    }
  };

  const handleChange = (e) => {
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

  const saveNewPayment = async () => {
    setError("");
    const { cardName, cardNum, expiryDate, cvv } = newPayment;
    if (!cardName || !cardNum || !expiryDate || !cvv)
      return setError("Please fill in all fields.");

    const isVisa = /^4/.test(cardNum);
    const isMastercard = /^5[1-5]/.test(cardNum);
    if (!isVisa && !isMastercard)
      return setError("Only Visa and MasterCard are accepted.");
    if (cvv.length !== 3 || cardNum.length !== 16)
      return setError("Invalid CVV or card number.");

    const payload = {
      ...newPayment,
      cardType: isVisa ? "Visa" : "MasterCard",
    };

    try {
      setSaving(true);
      await axios.post("/api/payments", payload);
      await fetchPayments();
      setNewPayment({
        cardName: "",
        cardNum: "",
        expiryDate: "",
        cvv: "",
        is_primary: false,
      });
      setShowNewPayment(false);
    } catch (err) {
      console.error("Error saving payment:", err);
      setError("Failed to save payment.");
    } finally {
      setSaving(false);
    }
  };

  const formatMaskedNumber = (last4) => `**** **** **** ${last4}`;

  const VisaLogo = () => (
    <svg width="60" height="18" viewBox="0 0 60 18" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <rect rx="2" width="60" height="18" fill="none" />
      <g fill="#fff" fontFamily="Verdana, sans-serif" fontWeight="700" fontSize="12">
        <text x="0" y="13">VISA</text>
      </g>
    </svg>
  );

  const MasterCardLogo = () => (
    <svg width="60" height="18" viewBox="0 0 60 18" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <circle cx="20" cy="9" r="7" fill="#FF5F00" />
      <circle cx="28" cy="9" r="7" fill="#EB001B" opacity="0.95" />
      <g transform="translate(38,1)">
        <text x="0" y="13" fill="#fff" fontFamily="Verdana, sans-serif" fontWeight="700" fontSize="12">
          Master
        </text>
      </g>
    </svg>
  );

  if (loading) return <p>Loading payments...</p>;

  return (
    <div className="container my-5">
      <h2 className="heading"><span>Payment Methods</span></h2>

      <div className="row payments-grid">
        {payments.length === 0 && !showNewPayment && (
          <p className="text-muted text-center my-4">No payment methods found.</p>
        )}

        {payments.map((card) => {
          const brand = (card.cardType || "").toLowerCase();
          const isVisa = brand.includes("visa");
          const isMaster = brand.includes("master");
          const ccClass = isVisa ? "cc-visa" : isMaster ? "cc-master" : "cc-generic";

          return (
            <div key={card.paymentID} className="col-md-4 mb-4 d-flex flex-column align-items-center">
              <div className={`cc-card ${ccClass}`}>
                {card.is_primary && <div className="badge-primary-top">PRIMARY</div>}
                <div className="cc-top" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div className="cc-chip" />
                    <div style={{ fontSize: 12, opacity: 0.95 }}>{card.cardName}</div>
                  </div>
                  <div className="cc-logo" aria-hidden>
                    {isVisa ? <VisaLogo /> : isMaster ? <MasterCardLogo /> : <VisaLogo />}
                  </div>
                </div>

                <div style={{ marginTop: 12 }}>
                  <div className="cc-number">{formatMaskedNumber(card.cardNum_last4)}</div>
                  <div className="d-flex justify-content-between align-items-center mt-2">
                    <div>
                      <div className="cc-name">{card.cardName}</div>
                      <div className="cc-exp">Exp: {card.expiryDate}</div>
                    </div>
                    <div className="text-end">
                      <small style={{ opacity: 0.9 }}>Ending</small>
                      <div style={{ fontFamily: "Courier New", fontWeight: 700 }}>{card.cardNum_last4}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card-actions mt-2 d-flex gap-2">
                {!card.is_primary && (
                  <Button variant="light" size="sm" onClick={() => handleSetPrimary(card.paymentID)}>
                    Make Primary
                  </Button>
                )}
                <Button variant="danger" size="sm" onClick={() => handleDelete(card.paymentID)}>
                  Delete
                </Button>
              </div>
            </div>
          );
        })}

        {/* ---- ADD NEW CARD (Inline) ---- */}
        <div className="col-md-4 mb-4 d-flex flex-column align-items-center">
          {!showNewPayment ? (
            <div
              className="cc-card cc-empty d-flex flex-column justify-content-center align-items-center"
              style={{
                border: "2px dashed #ccc",
                height: "220px",
                width: "100%",
                borderRadius: "12px",
                cursor: "pointer",
                background: "#f9f9f9",
              }}
              onClick={() => setShowNewPayment(true)}
            >
              <i className="bi bi-plus-circle" style={{ fontSize: "2rem", color: "#888" }}></i>
              <span className="mt-2 fw-bold text-secondary">Add New Card</span>
            </div>
          ) : (
            <div className="cc-card p-3 w-100 bg-light border rounded">
              {error && <div className="alert alert-danger py-1">{error}</div>}
              <Form.Control
                type="text"
                name="cardName"
                placeholder="Cardholder Name"
                className="mb-2"
                value={newPayment.cardName}
                onChange={handleChange}
              />
              <Form.Control
                type="text"
                name="cardNum"
                placeholder="Card Number"
                className="mb-2"
                value={newPayment.cardNum}
                onChange={handleChange}
              />
              <div className="d-flex gap-2">
                <Form.Control
                  type="text"
                  name="expiryDate"
                  placeholder="MM/YYYY"
                  className="mb-2"
                  value={newPayment.expiryDate}
                  onChange={handleChange}
                />
                <Form.Control
                  type="text"
                  name="cvv"
                  placeholder="CVV"
                  className="mb-2"
                  value={newPayment.cvv}
                  onChange={handleChange}
                />
              </div>
              <Form.Check
                type="checkbox"
                name="is_primary"
                label="Set as Primary"
                className="mb-2"
                checked={newPayment.is_primary}
                onChange={handleChange}
              />
              <div className="card-actions mt-2 d-flex gap-2">
                <Button variant="success" className="flex-fill" disabled={saving} onClick={saveNewPayment}>
                  {saving ? "Saving..." : "Save"}
                </Button>
                <Button variant="secondary" className="flex-fill" onClick={() => setShowNewPayment(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
