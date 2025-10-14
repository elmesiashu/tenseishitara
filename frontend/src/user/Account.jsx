import React, { useState, useEffect } from "react";

const API_BASE = process.env.REACT_APP_API_URL || window.location.origin;

export default function Account({ user }) {
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressID, setSelectedAddressID] = useState(null);

  const [profilePic, setProfilePic] = useState(user?.profilePic || "/images/placeholder.png");
  const [userInfo, setUserInfo] = useState({
    fullName: `${user?.fname || ""} ${user?.lname || ""}`,
    email: user?.email || "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch addresses
  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/addresses`, { credentials: "include" });
        const data = await res.json();
        // Sort primary first
        const sorted = data.sort((a, b) => b.is_primary - a.is_primary);
        setAddresses(sorted);
        setSelectedAddressID(sorted[0]?.addressID || null);
      } catch (err) {
        console.error("Error fetching addresses:", err);
      }
    };
    fetchAddresses();
  }, []);

  const handleProfilePicChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setProfilePic(reader.result);
    reader.readAsDataURL(file);
  };

  const handleUserChange = (e) => {
    const { name, value } = e.target;
    setUserInfo(prev => ({ ...prev, [name]: value }));
  };

  const handleAddressChange = (id, field, value) => {
    setAddresses(prev => prev.map(addr => addr.addressID === id ? { ...addr, [field]: value } : addr));
  };

  const handleSave = async () => {
    setError("");
    setLoading(true);
    try {
      // Save user info
      await fetch(`${API_BASE}/api/user/${user.userID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ profilePic, ...userInfo }),
      });

      // Save addresses
      for (const addr of addresses) {
        await fetch(`${API_BASE}/api/addresses/${addr.addressID}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(addr),
        });
      }

      alert("Profile and addresses updated!");
    } catch (err) {
      setError("Failed to save changes.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container my-5">
      <h2 className="mb-4">My Account</h2>
      <div className="row">
        {/* Profile Info */}
        <div className="col-md-4 mb-4 text-center">
          <div className="card shadow-sm p-3">
            <img
              src={profilePic}
              alt="Profile"
              className="rounded-circle mb-3"
              style={{ width: 150, height: 150, objectFit: "cover" }}
            />
            <input type="file" className="form-control form-control-sm" onChange={handleProfilePicChange} />
            <input
              type="text"
              name="fullName"
              placeholder="Full Name"
              className="form-control mt-3"
              value={userInfo.fullName}
              onChange={handleUserChange}
            />
            <input
              type="email"
              name="email"
              placeholder="Email"
              className="form-control mt-2"
              value={userInfo.email}
              onChange={handleUserChange}
            />
          </div>
        </div>

        {/* Addresses */}
        <div className="col-md-8">
          <div className="card shadow-sm p-4">
            <h5 className="mb-3">Shipping Addresses</h5>
            {error && <div className="alert alert-danger">{error}</div>}
            {addresses.map((addr) => (
              <div key={addr.addressID} className={`border p-3 mb-3 rounded ${addr.is_primary ? "border-success" : ""}`}>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <strong>{addr.fullName}</strong>
                  {addr.is_primary && <span className="badge bg-success">Primary</span>}
                </div>
                <input
                  type="text"
                  className="form-control mb-1"
                  value={addr.address}
                  onChange={(e) => handleAddressChange(addr.addressID, "address", e.target.value)}
                />
                <input
                  type="text"
                  className="form-control mb-1"
                  value={addr.unit}
                  placeholder="Unit/Suite"
                  onChange={(e) => handleAddressChange(addr.addressID, "unit", e.target.value)}
                />
                <div className="d-flex gap-2 mb-1">
                  <input
                    type="text"
                    className="form-control"
                    value={addr.city}
                    placeholder="City"
                    onChange={(e) => handleAddressChange(addr.addressID, "city", e.target.value)}
                  />
                  <input
                    type="text"
                    className="form-control"
                    value={addr.state}
                    placeholder="State"
                    onChange={(e) => handleAddressChange(addr.addressID, "state", e.target.value)}
                  />
                  <input
                    type="text"
                    className="form-control"
                    value={addr.zipCode}
                    placeholder="ZIP"
                    onChange={(e) => handleAddressChange(addr.addressID, "zipCode", e.target.value)}
                  />
                </div>
                <input
                  type="text"
                  className="form-control"
                  value={addr.phoneNum}
                  placeholder="Phone Number"
                  onChange={(e) => handleAddressChange(addr.addressID, "phoneNum", e.target.value)}
                />
              </div>
            ))}
            <button className="btn btn-primary w-100 mt-3" onClick={handleSave} disabled={loading}>
              {loading ? "Saving..." : "Save All Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
