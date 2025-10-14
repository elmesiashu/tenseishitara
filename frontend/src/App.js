import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import axios from "axios";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

// ---------- User Pages ----------
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Search from "./pages/Search";
import Cart from "./pages/Cart";
import ProductInfo from "./pages/Product";
import Category from "./pages/Category";
import Checkout from "./pages/Checkout";
import ThankYou from "./pages/Thankyou";

// ---------- User Settings Pages ----------
import Account from "./user/Account";

// ---------- Admin Pages ----------
import Products from "./admin/Products";
import UploadProduct from "./admin/UploadProduct";
import Dashboard from "./admin/Dashboard";

// ---------- API Setup ----------
const API =
  process.env.REACT_APP_API_URL ||
  (window.location.hostname === "localhost"
    ? "http://localhost:5000"
    : "https://ts-anime-backend.onrender.com");

function AppWrapper() {
  const location = useLocation();

  // ---------- State ----------
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });
  const [checkingSession, setCheckingSession] = useState(true);
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem("cart");
    return saved ? JSON.parse(saved) : [];
  });
  const [siteDiscount] = useState(() => {
    const saved = sessionStorage.getItem("siteDiscount");
    return saved ? parseInt(saved) : Math.floor(Math.random() * 21) + 10;
  });

  // ---------- Axios Configuration ----------
  axios.defaults.withCredentials = true;
  axios.defaults.baseURL = API;

  // ---------- Restore User Session ----------
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const res = await axios.get(`/api/auth/me`);
        if (res.data?.user) {
          const normalizedUser = {
            ...res.data.user,
            isAdmin: !!res.data.user.isAdmin,
          };
          setUser(normalizedUser);
          localStorage.setItem("user", JSON.stringify(normalizedUser));
        } else {
          setUser(null);
          localStorage.removeItem("user");
        }
      } catch (err) {
        console.warn("No active session:", err?.response?.data || err.message);
        setUser(null);
        localStorage.removeItem("user");
      } finally {
        setCheckingSession(false);
      }
    };
    restoreSession();
  }, []);

  // ---------- Persist Cart ----------
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  // ---------- Add to Cart ----------
  const addToCart = (newItem) => {
    setCart((prevCart) => {
      const key = `${newItem.id}-${newItem.optionKey}`;
      const existing = prevCart.find(
        (item) => `${item.id}-${item.optionKey}` === key
      );
      const updatedCart = existing
        ? prevCart.map((item) =>
            `${item.id}-${item.optionKey}` === key
              ? { ...item, qty: item.qty + (newItem.qty || 1) }
              : item
          )
        : [...prevCart, newItem];
      localStorage.setItem("cart", JSON.stringify(updatedCart));
      return updatedCart;
    });
  };

  // ---------- Logout ----------
  const logout = async () => {
    try {
      await axios.post(`/api/auth/logout`);
    } catch (err) {
      console.error("Logout failed:", err);
    }
    setUser(null);
    localStorage.removeItem("user");
  };

  // ---------- Conditional Navbar/Footer ----------
  const hideNavbarAndFooter = ["/login", "/register"];

  // ---------- Route Guards ----------
  const AdminRoute = ({ element }) => {
    if (checkingSession) return <div>Checking authentication...</div>;
    return user?.isAdmin ? element : <Navigate to="/login" replace />;
  };

  const PrivateRoute = ({ element }) => {
    if (checkingSession) return <div>Checking authentication...</div>;
    return user ? element : <Navigate to="/login" replace />;
  };

  if (checkingSession) {
    return <div className="loading text-center mt-5">Checking session...</div>;
  }

  // ---------- Render ----------
  return (
    <>
      {!hideNavbarAndFooter.includes(location.pathname.toLowerCase()) && (
        <Navbar user={user} logout={logout} cart={cart} />
      )}

      {/* Wrap Routes inside <main> for sticky footer layout */}
      <main>
        <Routes>
          {/* HOME */}
          <Route
            path="/"
            element={
              user?.isAdmin ? (
                <Navigate to="/admin/dashboard" replace />
              ) : (
                <Home
                  user={user}
                  cart={cart}
                  setCart={setCart}
                  addToCart={addToCart}
                  siteDiscount={siteDiscount}
                />
              )
            }
          />

          {/* AUTH */}
          <Route path="/login" element={<Login setUser={setUser} />} />
          <Route path="/register" element={<Register />} />

          {/* USER ROUTES */}
          <Route
            path="/cart"
            element={
              <Cart
                initialCart={cart}
                setCart={setCart}
                userLoggedIn={!!user}
                siteDiscount={siteDiscount}
              />
            }
          />
          <Route
            path="/checkout"
            element={
              <Checkout
                cart={cart}
                setCart={setCart}
                user={user}
                siteDiscount={siteDiscount}
              />
            }
          />
          <Route
            path="/product/:id"
            element={
              <ProductInfo addToCart={addToCart} siteDiscount={siteDiscount} />
            }
          />
          <Route
            path="/search"
            element={
              <Search
                addToCart={addToCart}
                cart={cart}
                setCart={setCart}
                user={user}
                siteDiscount={siteDiscount}
              />
            }
          />
          <Route
            path="/category/:id"
            element={
              <Category addToCart={addToCart} siteDiscount={siteDiscount} />
            }
          />
          <Route path="/account" element={<PrivateRoute element={<Account user={user} setUser={setUser} />}/>}/>
          <Route path="/thankyou" element={<ThankYou />} />

          {/* ADMIN ROUTES */}
          <Route
            path="/admin/dashboard"
            element={<AdminRoute element={<Dashboard user={user} />} />}
          />
          <Route
            path="/admin/products"
            element={<AdminRoute element={<Products />} />}
          />
          <Route
            path="/admin/products/upload"
            element={<AdminRoute element={<UploadProduct />} />}
          />

          {/* FALLBACK */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Footer appears on every page except login/register */}
      {!hideNavbarAndFooter.includes(location.pathname.toLowerCase()) && (
        <Footer />
      )}
    </>
  );
}

// ---------- Root App ----------
export default function App() {
  return (
    <Router>
      <AppWrapper />
    </Router>
  );
}
