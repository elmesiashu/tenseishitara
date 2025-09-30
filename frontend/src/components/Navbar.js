import React, { useState, useEffect } from "react";
import { FaHome, FaBars, FaTimes, FaSearch } from "react-icons/fa";
import { BsBasket, BsFillMoonFill, BsStack } from "react-icons/bs";

export default function Navbar({ userName = "Guest" }) {
  const [darkMode, setDarkMode] = useState(false);
  const [productToggle, setProductToggle] = useState(false);
  const [menuSlide, setMenuSlide] = useState(false);

  // Toggle dark mode
  const handleDarkModeToggle = () => {
    setDarkMode(!darkMode);
  };

  // Add or remove body class based on darkMode state
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add("active");
    } else {
      document.body.classList.remove("active");
    }
  }, [darkMode]);

  // Toggle product categories menu
  const showProducts = () => setProductToggle(true);
  const hideProducts = () => setProductToggle(false);

  // Toggle menu slide
  const toggleMenu = () => setMenuSlide(!menuSlide);

  return (
    <>
      <header className="header">
        <section className="flex">
          <a href="#" className="logo">
            Tensei Shitara<span>.</span>
          </a>

          <form action="/product" method="GET">
            <input
              type="text"
              name="keyword"
              id="keyword"
              placeholder="Search..."
            />
            <button
              className="btn"
              name="search"
              value="search"
              style={{ backgroundColor: "transparent" }}
            >
              <FaSearch />
            </button>
          </form>

          <div className="icons">
            <div className="icon-wrapper">
              <div className="rotating-icon">
                <a href="/" title="Home">
                  <FaHome />
                </a>
              </div>
            </div>

            <div
              className="icon-wrapper"
              title="Products"
              onMouseEnter={showProducts}
              onMouseLeave={hideProducts}
            >
              <div className="rotating-icon">
                <BsStack />
              </div>

              {productToggle && (
                <div className="product-categories">
                  <a href="#figurine">Figurine</a>
                  <a href="#plush">Plush</a>
                  <a href="#accessories">Accessories</a>
                  <a href="#manga">Manga</a>
                  <a href="#novel">Novel</a>
                  <a href="#clothes">Clothes</a>
                  <a href="#others">Others</a>
                </div>
              )}
            </div>

            <div className="icon-wrapper">
              <div className="rotating-icon">
                <a href="/cart" title="Cart">
                  <BsBasket />
                </a>
              </div>
            </div>

            <div
              className="icon-wrapper"
              id="theme-toggler"
              title="Toggle Theme"
              onClick={handleDarkModeToggle}
            >
              <div className="rotating-icon">
                <BsFillMoonFill />
              </div>
            </div>

            <div className="icon-wrapper" id="settings" onClick={toggleMenu}>
              <div className="rotating-icon">
                <FaBars />
              </div>
            </div>
          </div>
        </section>
      </header>

      <nav className={`navbar ${menuSlide ? "active" : ""}`}>
        <div className="user">
          <img src="/images/img1/userImage.png" alt="user" />
          <h3>{userName}</h3>
        </div>

        <div className="links">
          <a href="/">Home</a>
          <a href="#products">Popular Anime</a>
          <a href="#featured">Best Package</a>

          <form action="/login" method="POST">
            <button className="btn btn-primary" name="Login">
              Login
            </button>
          </form>
        </div>

        <div id="close" className="close-icon" onClick={toggleMenu}>
          <FaTimes />
        </div>
      </nav>
    </>
  );
}
