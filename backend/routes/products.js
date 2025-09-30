const express = require('express');
const db = require('../db');
const router = express.Router();

// Get all products
router.get('/', (req, res) => {
  db.query('SELECT * FROM products', (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});

// Get product options by product id
router.get('/:id/options', (req, res) => {
  const productId = req.params.id;
  db.query('SELECT * FROM product_options WHERE product_id = ?', [productId], (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});

// Admin upload product
router.post('/upload', (req, res) => {
  const user = req.session.user;
  if (!user || !user.is_admin) return res.status(403).json({ message: 'Not authorized' });

  const { name, description, price, options } = req.body;
  db.query('INSERT INTO products (name, description, price) VALUES (?, ?, ?)', [name, description, price], (err, result) => {
    if (err) return res.status(500).json(err);
    const productId = result.insertId;

    if (options && options.length > 0) {
      options.forEach(opt => {
        db.query('INSERT INTO product_options (product_id, option_name, option_value, image_url) VALUES (?, ?, ?, ?)',
          [productId, opt.option_name, opt.option_value, opt.image_url]);
      });
    }
    res.json({ message: 'Product uploaded' });
  });
});

module.exports = router;
