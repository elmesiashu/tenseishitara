import React, { useState, useEffect } from "react";
import { FaTimes } from "react-icons/fa";
import { BsSearch, BsHouseFill, BsBasket, BsJournal, BsFillMoonFill, BsServer, BsBarChartFill, BsJustify} from "react-icons/bs";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

export default function Navbar({ user, logout, cart = [] }) {
  const [darkMode, setDarkMode] = useState(false);
  const [menuSlide, setMenuSlide] = useState(false);
  const [animeList, setAnimeList] = useState([]);
  const [showAnimeDropdown, setShowAnimeDropdown] = useState(false);
  const navigate = useNavigate();

  // Toggle dark mode
  const handleDarkModeToggle = () => setDarkMode((prev) => !prev);

  // Load correct CSS depending on user type (admin vs user)
  useEffect(() => {
    if (user?.isAdmin) {
      import("../css/admin.css");
    } else {
      import("../App.css");
    }
  }, [user]);

  // Apply dark mode to body
  useEffect(() => {
    document.body.classList.toggle("active", darkMode);
  }, [darkMode]);

  // Fetch anime list
  useEffect(() => {
    axios
      .get(`${API}/api/anime`)
      .then((res) => setAnimeList(res.data))
      .catch((err) => console.error("Failed to load anime list:", err));
  }, []);

  // Cart counter
  const cartCount = cart.reduce((sum, item) => sum + (item.qty || 1), 0);

  // Compute correct user image URL
  const getUserImage = (imgPath) =>
    imgPath ? `${API}${imgPath}` : `${API}/uploads/default.png`;

  const handleAnimeSelect = (animeName) => {
    setShowAnimeDropdown(false);
    navigate(`/category/${encodeURIComponent(animeName)}`);
  };

  // ---------------- ADMIN NAVBAR ----------------
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
              <Link
                className="icon-wrapper"
                to="/admin/dashboard"
                title="Dashboard"
              >
                <BsServer />
              </Link>

              <Link className="icon-wrapper" to="/admin/products" title="Products">
                <BsJournal />
              </Link>

              <Link className="icon-wrapper" to="/admin/reports" title="Reports">
                <BsBarChartFill />
              </Link>

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
              src={getUserImage(user?.userImg)}
              alt="Admin Avatar"
              className="rounded-circle"
            />
            <h5>{user?.fname || "Admin"}</h5>
          </div>

          <div className="links text-center">
            <Link to="/admin/dashboard" className="nav-link">Dashboard</Link>
            <Link to="/admin/products" className="nav-link">Products</Link>
            <Link to="/admin/orders" className="nav-link">Orders</Link>
            <Link to="/admin/users" className="nav-link">Users</Link>
            <Link to="/admin/reviews" className="nav-link">Reviews</Link>
            <Link to="/admin/promotions" className="nav-link">Promotions</Link>
            <Link to="/admin/reports" className="nav-link">Reports</Link>
            <Link to="/admin/settings" className="nav-link">Settings</Link>

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

  // ---------------- USER NAVBAR ----------------
  return (
    <>
      <header className="header">
        <section className="flex">
          <Link to="/" className="logo">Tensei Shitara<span>.</span></Link>

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
            <Link to="/" className="icon-wrapper" title="Home">
              <BsHouseFill />
            </Link>

            <Link to="/search" className="icon-wrapper" title="Products">
              <BsJournal />
            </Link>

            {/* Cart + Anime Dropdown */}
            <div
              className="icon-wrapper cart-icon"
              onMouseEnter={() => setShowAnimeDropdown(true)}
              onMouseLeave={() => setShowAnimeDropdown(false)}
            >
              <Link to="/cart" title="Cart" className="cart-link">
                <BsBasket />
                {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
              </Link>

              {showAnimeDropdown && animeList.length > 0 && (
                <div className="anime-dropdown">
                  {animeList.map((anime) => (
                    <div
                      key={anime.id}
                      className="anime-item"
                      onClick={() => handleAnimeSelect(anime.name)}
                    >
                      {anime.name}
                    </div>
                  ))}
                </div>
              )}
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
            src={getUserImage(user?.userImg)}
            alt="User Avatar"
            className="rounded-circle"
          />
          <h5>{user?.fname || "Guest"}</h5>
        </div>

        <div className="links text-center">
          <Link to="/" className="nav-link">Home</Link>
          <Link to="/search" className="nav-link">Anime Series
          </Link>
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
              }}>Login
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
