// src/App.js
import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Search from "./pages/Search";
import Cart from "./pages/Cart";
import ProductInfo from "./pages/Product";
import Products from "./admin/Products";
import UploadProduct from "./admin/UploadProduct";
import Dashboard from "./admin/Dashboard";

function AppWrapper() {
  const location = useLocation();

  // USER STATE
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });

  // CART STATE
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem("cart");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  const hideNavbar = ["/login", "/register"];

  const [siteDiscount] = useState(() => {
    const saved = sessionStorage.getItem("siteDiscount");
    return saved ? parseInt(saved) : Math.floor(Math.random() * 21) + 10;
  });

  // Admin protected route wrapper
  const AdminRoute = ({ element }) =>
    user?.isAdmin ? element : <Navigate to="/login" replace />;

  return (
    <>
      {!hideNavbar.includes(location.pathname.toLowerCase()) && (
        <Navbar user={user} logout={logout} cart={cart} />
      )}

      <Routes>
        {/* PUBLIC ROUTES */}
        <Route
          path="/"
          element={
            <Home
              user={user}
              cart={cart}
              setCart={setCart}
              siteDiscount={siteDiscount}
            />
          }
        />
        <Route path="/login" element={<Login setUser={setUser} />} />
        <Route path="/register" element={<Register />} />

        {/* CART */}
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

        {/* PRODUCT PAGES */}
        <Route
          path="/product/:id"
          element={<ProductInfo cart={cart} setCart={setCart} />}
        />
        <Route
          path="/search"
          element={
            <Search
              cart={cart}
              setCart={setCart}
              user={user}
              siteDiscount={siteDiscount}
            />
          }
        />

        {/* ADMIN ROUTES */}
        <Route path="/admin/dashboard" element={<AdminRoute element={<Dashboard user={user} />} />} />
        <Route path="/admin/products" element={<AdminRoute element={<Products />} />} />
        <Route path="/admin/uploadproduct" element={<AdminRoute element={<UploadProduct />} />} />

        {/* CATCH ALL */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <Router>
      <AppWrapper />
    </Router>
  );
}
