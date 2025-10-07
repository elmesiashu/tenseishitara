import React, { useState, useEffect } from "react";
import { FaTimes } from "react-icons/fa";
import { BsSearch, BsHouseFill, BsBasket, BsJournal, BsFillMoonFill, BsServer, BsBarChartFill, BsJustify } from "react-icons/bs";
import { Link, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

export default function Navbar({ user, logout, cart = [] }) {
  const [darkMode, setDarkMode] = useState(false);
  const [menuSlide, setMenuSlide] = useState(false);
  const [animeList, setAnimeList] = useState([]);
  const [showAnimeDropdown, setShowAnimeDropdown] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Toggle dark mode
  const handleDarkModeToggle = () => setDarkMode((prev) => !prev);

  // Load CSS
  useEffect(() => {
    if (user?.isAdmin) {
      import("../css/admin.css");
    } else {
      import("../App.css");
    }
  }, [user]);

  // Apply dark mode
  useEffect(() => {
    document.body.classList.toggle("active", darkMode);
  }, [darkMode]);

  // Fetch anime list
  useEffect(() => {
    axios
      .get(`${API}/api/products/anime`)
      .then((res) => setAnimeList(res.data))
      .catch((err) => console.error("Error fetching anime list:", err));
  }, []);

  // Navigate to selected anime
  const handleAnimeSelect = (animeName) => {
    setShowAnimeDropdown(false);
    navigate(`/category/${encodeURIComponent(animeName)}`);
  };

  const cartCount = cart.reduce((sum, item) => sum + (item.qty || 1), 0);

  const getUserImage = (imgPath) =>
    imgPath ? `${API}${imgPath}` : `${API}/uploads/default.png`;

  // -------------------- ADMIN NAVBAR --------------------
  if (user?.isAdmin) {
    return (
      <>
        <header className="header admin-header">
          <section className="flex">
            <Link to="/admin/dashboard" className="logo">
              Admin Panel<span>.</span>
            </Link>

            <form>
              <input type="text" placeholder="Search products..." />
              <button type="submit">
                <BsSearch />
              </button>
            </form>

            <div className="icons">
              <Link className="icon-wrapper" to="/admin/dashboard" title="Dashboard">
                <BsServer />
              </Link>
              <Link className="icon-wrapper" to="/admin/products" title="Products">
                <BsJournal />
              </Link>
              <Link className="icon-wrapper" to="/admin/reports" title="Reports">
                <BsBarChartFill />
              </Link>
              <div className="icon-wrapper" title="Toggle Theme" onClick={handleDarkModeToggle}>
                <BsFillMoonFill />
              </div>
              <div className="icon-wrapper" onClick={() => setMenuSlide(!menuSlide)}>
                <BsJustify />
              </div>
            </div>
          </section>
        </header>

        <nav className={`navbar ${menuSlide ? "active" : ""}`}>
          <div className="user text-center">
            <img src={getUserImage(user?.userImg)} alt="Admin Avatar" className="rounded-circle" />
            <h5>{user?.fname || "Admin"}</h5>
          </div>

          <div className="links text-center">
            <Link to="/admin/dashboard" className="nav-link">Dashboard</Link>
            <Link to="/admin/products" className="nav-link">Products</Link>
            <Link to="/admin/orders" className="nav-link">Orders</Link>
            <Link to="/admin/users" className="nav-link">Users</Link>
            <Link to="/admin/reports" className="nav-link">Reports</Link>
            {user ? (
              <button className="btn btn-danger mt-3" onClick={logout}>Logout</button>
            ) : (
              <Link to="/login" className="btn btn-primary mt-3">Login</Link>
            )}
          </div>

          <div id="close" className="close-icon" onClick={() => setMenuSlide(false)}>
            <FaTimes />
          </div>
        </nav>
      </>
    );
  }

  // -------------------- USER NAVBAR --------------------
  return (
    <>
      <header className="header">
        <section className="flex">
          <Link to="/" className="logo">
            Tensei Shitara<span>.</span>
          </Link>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const keyword = e.target.elements.keyword.value.trim();
              if (keyword) {
                navigate(`/search?keyword=${encodeURIComponent(keyword)}`);
              }
            }}
          >
            <input
              type="text"
              name="keyword"
              placeholder="Search..."
              defaultValue={new URLSearchParams(window.location.search).get("keyword") || ""}
            />
            <button type="submit">
              <BsSearch />
            </button>
          </form>

          <div className="icons">
            {location.pathname !== "/" && (
              <Link to="/" className="icon-wrapper" title="Home">
                <BsHouseFill />
              </Link>
            )}

            {/* Products Dropdown
            <div
              className="dropdown"
              onMouseEnter={() => setShowAnimeDropdown(true)}
              onMouseLeave={() => setShowAnimeDropdown(false)}
            >
              <div className="icon-wrapper dropbtn" title="Products">
                <BsJournal />
              </div>

              {showAnimeDropdown && (
                <div className="dropdown-content">
                  {animeList.length > 0 ? (
                    animeList.map((anime) => (
                      <div
                        key={anime.animeID}
                        className="dropdown-item"
                        onClick={() => handleAnimeSelect(anime.animeName)}
                      >
                        {anime.animeName}
                      </div>
                    ))
                  ) : (
                    <div className="dropdown-item">No anime found</div>
                  )}
                </div>
              )}
            </div> */}

            {/* Cart */}
            <div className="icon-wrapper cart-icon">
              <Link to="/cart" title="Cart" className="cart-link">
                <BsBasket />
                {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
              </Link>
            </div>

            <div className="icon-wrapper" title="Toggle Theme" onClick={handleDarkModeToggle}>
              <BsFillMoonFill />
            </div>

            <div className="icon-wrapper" onClick={() => setMenuSlide(!menuSlide)}>
              <BsJustify />
            </div>
          </div>
        </section>
      </header>

      <nav className={`navbar ${menuSlide ? "active" : ""}`}>
        <div className="user text-center">
          <img src={getUserImage(user?.userImg)} alt="User Avatar" className="rounded-circle" />
          <h5>{user?.fname || "Guest"}</h5>
        </div>

        <div className="links text-center">
          {location.pathname !== "/" && <Link to="/" className="nav-link">Home</Link>}
          <Link to="/search" className="nav-link">Anime Series</Link>
          <Link to="/contact" className="nav-link">Contact Us</Link>
          {user ? (
            <>
              <Link to="/order" className="nav-link">Order History</Link>
              <Link to="/payment" className="nav-link">Payment</Link>
              <Link to="/account" className="nav-link">Account</Link>
              <Link to="/settings" className="nav-link">Settings</Link>
              <button className="btn btn-danger mt-3" onClick={logout}>Logout</button>
            </>
          ) : (
            <button
              className="btn btn-primary mt-3"
              onClick={() => {
                setMenuSlide(false);
                navigate("/login");
              }}
            >
              Login
            </button>
          )}
        </div>

        <div id="close" className="close-icon" onClick={() => setMenuSlide(false)}>
          <FaTimes />
        </div>
      </nav>
    </>
  );
}