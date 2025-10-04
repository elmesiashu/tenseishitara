import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../css/auth.css';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export default function Login({ setUser }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const res = await axios.post(
        `${API}/api/auth/login`,
        { username, password },
        { withCredentials: true }
      );

      if (res.data?.user) {
        const user = res.data.user;
        setUser(user);

        // Merge session cart to backend
        const sessionCart = JSON.parse(sessionStorage.getItem('cart')) || [];
        if (sessionCart.length > 0) {
          await Promise.all(
            sessionCart.map(item =>
              axios.post(
                `${API}/api/cart`,
                { productID: item.productID, quantity: item.quantity, price: item.price },
                { withCredentials: true }
              )
            )
          );
          sessionStorage.removeItem('cart');
        }

        if (remember) localStorage.setItem('user', JSON.stringify(user));

        if (user.isAdmin) navigate('../admin/dashboard');
        else navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div className="auth-wrapper" style={{ position: 'relative' }}>
      {/* X button at top-right of viewport */}
      <button
        onClick={() => navigate('/')}
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          border: 'none',
          background: 'transparent',
          fontSize: '2rem',
          cursor: 'pointer',
          zIndex: 1000
        }}
        aria-label="Close"
      >
        &times;
      </button>

      <div className="left-panel">
        <h2 className="title">Login here</h2>
        {error && <div className="error">{error}</div>}
        <form onSubmit={handleLogin}>
          <div className="field">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <label>Username</label>
          </div>
          <div className="field">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <label>Password</label>
          </div>
          <div className="field remember-forgot">
            <div>
              <input
                type="checkbox"
                id="remember"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              <label htmlFor="remember">Remember me</label>
            </div>
            <Link to="/forgot-password" className="forgot">Forgot password?</Link>
          </div>
          <div className="field">
            <input type="submit" value="Login" />
          </div>
        </form>
        <div className="social-login">
          <span>or use your account</span>
          <div className="social-icons">
            <button className="fb">F</button>
            <button className="google">G</button>
            <button className="linkedin">in</button>
          </div>
        </div>
      </div>

      <div className="right-panel">
        <h2>Start your anime shop now</h2>
        <p>If you don’t have an account yet, join us and start your journey</p>
        <Link to="/register" className="btn-register">Register</Link>
      </div>
    </div>
  );
}
