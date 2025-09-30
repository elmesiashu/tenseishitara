const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../db');
const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  const hashed = await bcrypt.hash(password, 10);
  db.query('INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
    [username, email, hashed],
    (err, result) => {
      if (err) return res.status(500).json(err);
      res.json({ message: 'User registered' });
    });
});

// Login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
    if (err || results.length === 0) return res.status(400).json({ message: 'Invalid credentials' });
    const match = await bcrypt.compare(password, results[0].password);
    if (!match) return res.status(400).json({ message: 'Invalid credentials' });
    req.session.user = { id: results[0].id, username: results[0].username, is_admin: results[0].is_admin };
    res.json({ message: 'Logged in', user: req.session.user });
  });
});

// Logout
router.post('/logout', (req, res) => {
  req.session.destroy();
  res.json({ message: 'Logged out' });
});

module.exports = router;
