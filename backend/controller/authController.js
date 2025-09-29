const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { createUser, getUserByEmail } = require('../models/userModel');

const signup = (req, res) => {
  const { name, email, password } = req.body;
  bcrypt.hash(password, 10, (err, hash) => {
    if (err) return res.status(500).json({ error: err });
    createUser(name, email, hash, (err, result) => {
      if (err) return res.status(500).json({ error: err });
      res.json({ message: 'User created successfully' });
    });
  });
};

const login = (req, res) => {
  const { email, password } = req.body;
  getUserByEmail(email, (err, users) => {
    if (err) return res.status(500).json({ error: err });
    if (users.length === 0) return res.status(400).json({ error: 'User not found' });

    bcrypt.compare(password, users[0].password, (err, isMatch) => {
      if (err) return res.status(500).json({ error: err });
      if (!isMatch) return res.status(400).json({ error: 'Password incorrect' });

      const token = jwt.sign({ id: users[0].id, email: users[0].email }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });
      res.json({ token, user: { name: users[0].name, email: users[0].email } });
    });
  });
};

module.exports = { signup, login };
