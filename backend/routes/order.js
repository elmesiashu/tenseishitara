const express = require("express");
const db = require("../db");
const router = express.Router();

// ----------------- Create new order -----------------
router.post("/", async (req, res) => {
  const { userID, items, shipping, subTotal, tax, total } = req.body;

  if (!userID || !items || items.length === 0) {
    return res.status(400).json({ message: "Invalid order data" });
  }

  const connection = await db.promise().getConnection();

  try {
    await connection.beginTransaction();

    // Insert order
    const [orderResult] = await connection.query(
      `INSERT INTO orders 
      (userID, country, first_name, last_name, address, city, state, zip_code, phone_number, email_address, subTotal, tax, total) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userID,
        shipping.country,
        shipping.first_name,
        shipping.last_name,
        shipping.address,
        shipping.city,
        shipping.state,
        shipping.zip_code,
        shipping.phone_number,
        shipping.email_address,
        subTotal,
        tax,
        total,
      ]
    );

    const orderID = orderResult.insertId;

    // Insert order items
    for (const item of items) {
      await connection.query(
        `INSERT INTO order_items (orderID, product_name, product_image, price, quantity)
         VALUES (?, ?, ?, ?, ?)`,
        [orderID, item.name, item.pic || null, item.price, item.qty]
      );
    }

    await connection.commit();
    res.status(201).json({ message: "Order placed successfully", orderID });
  } catch (err) {
    await connection.rollback();
    console.error(err);
    res.status(500).json({ message: "Error placing order", error: err });
  } finally {
    connection.release();
  }
});

// ----------------- GET USER ORDER -----------------
router.get("/:userID", (req, res) => {
  const { userID } = req.params;

  const sql = `
    SELECT o.*, oi.product_name, oi.product_image, oi.price, oi.quantity
    FROM orders o
    LEFT JOIN order_items oi ON o.orderID = oi.orderID
    WHERE o.userID = ?
    ORDER BY o.created_at DESC
  `;

  db.query(sql, [userID], (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});

module.exports = router;
