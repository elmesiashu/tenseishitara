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
} from "react-icons/bs";
import { Link } from "react-router-dom";

export default function Navbar({ user, logout }) {
  const [darkMode, setDarkMode] = useState(false);
  const [productToggle, setProductToggle] = useState(false);
  const [menuSlide, setMenuSlide] = useState(false);

  const handleDarkModeToggle = () => setDarkMode(!darkMode);

  useEffect(() => {
    if (user?.isAdmin === 1) {
      import("../css/admin.css");
    } else {
      import("../App.css");
    }
  }, [user]);

  useEffect(() => {
    if (darkMode) document.body.classList.add("active");
    else document.body.classList.remove("active");
  }, [darkMode]);

  // ---------------- ADMIN NAVBAR ----------------
  if (user?.isAdmin === 1) {
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
                <Link to="/admin/dashboard" title="Dashboard">
                  <BsServer />
                </Link>
              </div>
              <div className="icon-wrapper">
                <Link to="/" title="Invoices">
                  <BsReceipt />
                </Link>
              </div>
              <div className="icon-wrapper">
                <Link to="/" title="Reports">
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
            <h5>{user?.fname || "Guest"}</h5>
          </div>

          <div className="links text-center">
            <Link to="/admin/dashboard" className="nav-link">
              Dashboard
            </Link>
            <Link to="/admin/products" className="nav-link">
              Products
            </Link>
            <Link to="/" className="nav-link">
              Orders
            </Link>
            <Link to="/" className="nav-link">
              User
            </Link>
            <Link to="/" className="nav-link">
              Reviews
            </Link>
            <Link to="/" className="nav-link">
              Promotions
            </Link>
            <Link to="/" className="nav-link">
              Reports
            </Link>
            <Link to="/" className="nav-link">
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

          <div id="close" className="close-icon" onClick={() => setMenuSlide(false)}>
            <FaTimes />
          </div>
        </nav>
      </>
    );
  }

  // ---------------- DEFAULT USER NAVBAR ----------------
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
            {/* Home Icon */}
            <div className="icon-wrapper">
              <Link to="/" title="Home">
                <BsHouseFill className="rotating-icons" />
              </Link>
            </div>

              {/* Icon wrapper */}
              <div className="icon-wrapper" title="Products">
                <BsJournal className="rotating-icon" />
              </div>

            {/* Cart Icon */}
            <div className="icon-wrapper">
              <Link to="/cart" title="Cart">
                <BsBasket className="rotating-icons" />
              </Link>
            </div>

            {/* Dark Mode */}
            <div
              className="icon-wrapper"
              title="Toggle Theme"
              onClick={handleDarkModeToggle}
            >
              <BsFillMoonFill className="rotating-icon" />
            </div>

            {/* Menu Slide */}
            <div
              className="icon-wrapper"
              onClick={() => setMenuSlide(!menuSlide)}
            >
              <BsJustify className="rotating-icon" />
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
          <Link to="/" className="nav-link">
            Dashboard
          </Link>
          <Link to="/" className="nav-link">
            Product Information
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

        <div id="close" className="close-icon" onClick={() => setMenuSlide(false)}>
          <FaTimes />
        </div>
      </nav>
    </>
  );
}
