import React from "react";
import { Link } from "react-router-dom";
import paymentImg from "../assets/images/payment.png"; // ✅ adjust this path if needed

export default function Footer() {
  return (
    <footer className="footer bg-dark text-light pt-5 pb-3 mt-5">
      <div className="container">
        <div className="row gy-4">
          {/* ---------- Quick Links ---------- */}
          <div className="col-6 col-md-3">
            <h5 className="text-uppercase mb-3">Quick Links</h5>
            <ul className="list-unstyled">
              <li><Link className="text-light text-decoration-none" to="/">Home</Link></li>
              <li><Link className="text-light text-decoration-none" to="/products">Products</Link></li>
              <li><Link className="text-light text-decoration-none" to="/featured">Featured</Link></li>
              <li><Link className="text-light text-decoration-none" to="/deals">Deals</Link></li>
              <li><Link className="text-light text-decoration-none" to="/reviews">Reviews</Link></li>
            </ul>
          </div>

          {/* ---------- Account ---------- */}
          <div className="col-6 col-md-3">
            <h5 className="text-uppercase mb-3">Account</h5>
            <ul className="list-unstyled">
              <li><Link className="text-light text-decoration-none" to="/account">Account</Link></li>
              <li><Link className="text-light text-decoration-none" to="/history">History</Link></li>
              <li><Link className="text-light text-decoration-none" to="/cart">Cart</Link></li>
            </ul>
          </div>

          {/* ---------- Member ---------- */}
          <div className="col-6 col-md-3">
            <h5 className="text-uppercase mb-3">Member</h5>
            <ul className="list-unstyled">
              <li><Link className="text-light text-decoration-none" to="/login">Sign In</Link></li>
              <li><Link className="text-light text-decoration-none" to="/signup">Sign Up</Link></li>
            </ul>
          </div>

          {/* ---------- Contact Us ---------- */}
          <div className="col-6 col-md-3">
            <h5 className="text-uppercase mb-3">Contact Us</h5>
            <ul className="list-unstyled">
              <li><span className="d-block">📞 +1-234-567-890</span></li>
              <li><span className="d-block">✉️ tenseishitara@gmail.com</span></li>
              <li><span className="d-block">📍 Vancouver, Canada</span></li>
            </ul>
            <img
              src={paymentImg}
              alt="Payment Methods"
              className="img-fluid mt-2"
              style={{ maxWidth: "150px" }}
            />
          </div>
        </div>

        <hr className="border-secondary my-4" />

        <div className="text-center small">
          © {new Date().getFullYear()} <strong>TS Anime</strong>. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
