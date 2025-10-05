import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Account = ({ user, setUser }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
  });
  const [profileImage, setProfileImage] = useState(user?.profileImage || "/images/default-user.png");
  const [imageFile, setImageFile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!user) {
    navigate("/login");
    return null;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setProfileImage(URL.createObjectURL(file)); // preview
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const form = new FormData();
      form.append("firstName", formData.firstName);
      form.append("lastName", formData.lastName);
      form.append("email", formData.email);
      if (imageFile) form.append("profileImage", imageFile);

      const res = await axios.post("http://localhost:5000/api/user/update-profile", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Update local user data
      setUser(res.data.user);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      setIsEditing(false);
      alert("✅ Profile updated successfully!");
    } catch (err) {
      console.error("Error updating profile:", err);
      alert("❌ Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-5 container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="fw-bold text-primary">Account Information</h1>
        <button onClick={() => navigate(-1)} className="btn btn-secondary">
          Back
        </button>
      </div>

      <div className="card shadow-sm p-4 mx-auto" style={{ maxWidth: "700px" }}>
        {/* Profile Image */}
        <div className="text-center mb-4">
          <img
            src={profileImage}
            alt="Profile"
            className="rounded-circle shadow-sm"
            style={{ width: "150px", height: "150px", objectFit: "cover" }}
          />
          {isEditing && (
            <div className="mt-3">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="form-control"
                style={{ maxWidth: "300px", margin: "0 auto" }}
              />
            </div>
          )}
        </div>

        {/* User Info */}
        <table className="table table-borderless">
          <tbody>
            <tr>
              <th style={{ width: "30%" }}>First Name:</th>
              <td>
                {isEditing ? (
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="form-control"
                  />
                ) : (
                  user.firstName
                )}
              </td>
            </tr>
            <tr>
              <th>Last Name:</th>
              <td>
                {isEditing ? (
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="form-control"
                  />
                ) : (
                  user.lastName
                )}
              </td>
            </tr>
            <tr>
              <th>Email:</th>
              <td>
                {isEditing ? (
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="form-control"
                  />
                ) : (
                  user.email
                )}
              </td>
            </tr>
            <tr>
              <th>User ID:</th>
              <td>{user.userID}</td>
            </tr>
          </tbody>
        </table>

        {/* Buttons */}
        <div className="text-center mt-4">
          {isEditing ? (
            <>
              <button
                className="btn btn-success me-3"
                onClick={handleSave}
                disabled={loading}
              >
                {loading ? "Saving..." : "Save Changes"}
              </button>
              <button
                className="btn btn-outline-secondary"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              className="btn btn-primary"
              onClick={() => setIsEditing(true)}
            >
              Edit Profile
            </button>
          )}
        </div>
      </div>
    </section>
  );
};

export default Account;
