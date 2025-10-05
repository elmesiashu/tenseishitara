import React, { useState, useEffect } from "react";
import { FaTimes } from "react-icons/fa";
import {
  BsSearch,
  BsHouseFill,
  BsBasket,
  BsJournal,
  BsFillMoonFill,
  BsServer,
  BsBarChartFill,
  BsReceipt,
  BsJustify,
  BsPeople,
  BsGearFill,
  BsStarFill,
  BsGift,
} from "react-icons/bs";
import { Link } from "react-router-dom";

export default function Navbar({ user, logout, cart = [] }) {
  const [darkMode, setDarkMode] = useState(false);
  const [menuSlide, setMenuSlide] = useState(false);

  const handleDarkModeToggle = () => setDarkMode((prev) => !prev);

  // ✅ Load CSS dynamically based on user type
  useEffect(() => {
    if (user?.isAdmin) {
      import("../css/admin.css");
    } else {
      import("../App.css");
    }
  }, [user]);

  // ✅ Toggle dark mode class on body
  useEffect(() => {
    document.body.classList.toggle("active", darkMode);
  }, [darkMode]);

  const cartCount = cart.reduce((sum, item) => sum + (item.qty || 1), 0);

  // ---------------- ADMIN NAVBAR ----------------
  if (user?.isAdmin) {
    return (
      <>
        <header className="header admin-header">
          <section className="flex">
            <Link to="/admin/dashboard" className="logo">
              Admin Panel<span>.</span>
            </Link>

            <form action="/search" method="GET">
              <input type="text" name="keyword" placeholder="Search products..." />
              <button type="submit">
                <BsSearch />
              </button>
            </form>

            <div className="icons">
              <div className="icon-wrapper" title="Dashboard">
                <Link to="/admin/dashboard">
                  <BsServer />
                </Link>
              </div>

              <div className="icon-wrapper" title="Products">
                <Link to="/admin/products">
                  <BsJournal />
                </Link>
              </div>

              <div className="icon-wrapper" title="Reports">
                <Link to="/admin/reports">
                  <BsBarChartFill />
                </Link>
              </div>

              <div
                className="icon-wrapper"
                title="Toggle Theme"
                onClick={handleDarkModeToggle}
              >
                <BsFillMoonFill />
              </div>

              <div
                className="icon-wrapper"
                onClick={() => setMenuSlide(!menuSlide)}
              >
                <BsJustify />
              </div>
            </div>
          </section>
        </header>

        <nav className={`navbar ${menuSlide ? "active" : ""}`}>
          <div className="user text-center">
            <img
              src={
                user?.userImg
                  ? `http://localhost:5000${user.userImg}`
                  : "http://localhost:5000/uploads/default.png"
              }
              alt="user"
              className="rounded-circle"
            />
            <h5>{user?.fname || "Admin"}</h5>
          </div>

          <div className="links text-center">
            <Link to="/admin/dashboard" className="nav-link">
              Dashboard
            </Link>
            <Link to="/admin/products" className="nav-link">
              Products
            </Link>
            <Link to="/admin/orders" className="nav-link">
              Orders
            </Link>
            <Link to="/admin/users" className="nav-link">
              Users
            </Link>
            <Link to="/admin/reviews" className="nav-link">
              Reviews
            </Link>
            <Link to="/admin/promotions" className="nav-link">
              Promotions
            </Link>
            <Link to="/admin/reports" className="nav-link">
              Reports
            </Link>
            <Link to="/admin/settings" className="nav-link">
              Settings
            </Link>

            {user ? (
              <button className="btn btn-danger mt-3" onClick={logout}>
                Logout
              </button>
            ) : (
              <Link to="/login" className="btn btn-primary mt-3">
                Login
              </Link>
            )}
          </div>

          <div
            id="close"
            className="close-icon"
            onClick={() => setMenuSlide(false)}
          >
            <FaTimes />
          </div>
        </nav>
      </>
    );
  }

  // ---------------- USER NAVBAR ----------------
  return (
    <>
      <header className="header">
        <section className="flex">
          <Link to="/" className="logo">
            Tensei Shitara<span>.</span>
          </Link>

          <form action="/search" method="GET">
            <input type="text" name="keyword" placeholder="Search..." />
            <button type="submit">
              <BsSearch />
            </button>
          </form>

          <div className="icons">
            <div className="icon-wrapper">
              <Link to="/" title="Home">
                <BsHouseFill />
              </Link>
            </div>

            <div className="icon-wrapper">
              <Link to="/search" title="Products">
                <BsJournal />
              </Link>
            </div>

            <div className="icon-wrapper cart-icon">
              <Link to="/cart" title="Cart" className="cart-link">
                <BsBasket />
                {cartCount > 0 && (
                  <span className="cart-count">{cartCount}</span>
                )}
              </Link>
            </div>

            <div
              className="icon-wrapper"
              title="Toggle Theme"
              onClick={handleDarkModeToggle}
            >
              <BsFillMoonFill />
            </div>

            <div
              className="icon-wrapper"
              onClick={() => setMenuSlide(!menuSlide)}
            >
              <BsJustify />
            </div>
          </div>
        </section>
      </header>

      <nav className={`navbar ${menuSlide ? "active" : ""}`}>
        <div className="user text-center">
          <img
            src={
              user?.userImg
                ? `http://localhost:5000${user.userImg}`
                : "http://localhost:5000/uploads/default.png"
            }
            alt="user"
            className="rounded-circle"
          />
          <h5>{user?.fname || "Guest"}</h5>
        </div>

        <div className="links text-center">
          <Link to="/" className="nav-link">
            Home
          </Link>
          <Link to="/search" className="nav-link">
            Anime Series
          </Link>
          <Link to="/contact" className="nav-link">
            Contact Us
          </Link>

          {user ? (
            <>
              <Link to="/order" className="nav-link">
                Order History
              </Link>
              <Link to="/payment" className="nav-link">
                Payment
              </Link>
              <Link to="/account" className="nav-link">
                Account
              </Link>
              <Link to="/settings" className="nav-link">
                Settings
              </Link>
              <button className="btn btn-danger mt-3" onClick={logout}>
                Logout
              </button>
            </>
          ) : (
            <Link to="/login" className="btn btn-primary mt-3">
              Login
            </Link>
          )}
        </div>

        <div
          id="close"
          className="close-icon"
          onClick={() => setMenuSlide(false)}
        >
          <FaTimes />
        </div>
      </nav>
    </>
  );
}
