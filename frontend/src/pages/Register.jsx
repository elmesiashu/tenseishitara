import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import '../css/auth.css';

// Automatically switch between localhost and deployed backend
const API =
  process.env.REACT_APP_API_URL ||
  (window.location.hostname === 'localhost'
    ? 'http://localhost:5000'
    : 'https://ts-anime-backend.onrender.com');

export default function Register() {
  const [firstname, setFirstname] = useState('');
  const [lastname, setLastname] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const res = await axios.post(
        `${API}/api/auth/register`,
        { firstname, lastname, username, password },
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (res.data?.user) {
        navigate('/login');
      } else {
        setError('Registration failed. Please try again.');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.response?.data?.error || 'Registration failed');
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
          zIndex: 1000,
        }}
        aria-label="Close"
      >
        &times;
      </button>

      {/* Left Panel with anime background */}
      <div className="left-panel-rs">
        <h2>Hello Friend</h2>
        <p>
          If you already have an account,<br />
          login here and shop freely.
        </p>
        <Link to="/login" className="btn-register">
          Login
        </Link>
      </div>

      {/* Right Panel plain white */}
      <div className="right-panel-rs">
        <h2 className="title">Register</h2>
        {error && <div className="error">{error}</div>}
        <form onSubmit={handleRegister}>
          <div className="field">
            <input
              type="text"
              value={firstname}
              onChange={(e) => setFirstname(e.target.value)}
              required
            />
            <label>First Name</label>
          </div>
          <div className="field">
            <input
              type="text"
              value={lastname}
              onChange={(e) => setLastname(e.target.value)}
              required
            />
            <label>Last Name</label>
          </div>
          <div className="field">
            <input
              type="email"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <label>Email</label>
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
          <div className="field">
            <input type="submit" value="Register" />
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
    </div>
  );
}
