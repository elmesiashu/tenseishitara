const express = require('express');
const router = express.Router();
const db = require('../db');

// ----------------- Get Admin INFO -----------------
router.get('/admin/:userID', async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT fname, lname, isAdmin FROM user WHERE userID = ?",
      [req.params.userID]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get product inventory by category
router.get('/product-stats', async (req, res) => {
  try {
    const [categories] = await db.query("SELECT categoryID, SUM(stock) AS stock FROM product GROUP BY categoryID");
    const [total] = await db.query("SELECT SUM(stock) AS totalStock FROM product");
    res.json({ categories, total: total[0].totalStock });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get orders
router.get('/orders', async (req, res) => {
  try {
    const [orders] = await db.query(`
      SELECT u.fname, u.lname, o.product, o.quantity, o.price, o.orderDate, o.orderID
      FROM user u
      INNER JOIN order_detail o ON u.userID = o.userID
      ORDER BY o.orderDate
    `);
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
