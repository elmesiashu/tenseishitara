const express = require("express");
const router = express.Router();
const db = require("../db");

router.post("/", async (req, res) => {
  const { userID, items, addressID, paymentID, total } = req.body;
  if (!userID || !items?.length) return res.status(400).json({ message: "Invalid order" });

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Insert order
    const [orderResult] = await conn.query(
      `INSERT INTO orders (userID, addressID, paymentID, total, status, created_at) VALUES (?, ?, ?, ?, 'Order Placed', NOW())`,
      [userID, addressID, paymentID, total]
    );
    const orderID = orderResult.insertId;

    for (const item of items) {
      // Insert order item
      const [itemResult] = await conn.query(
        `INSERT INTO order_items (orderID, productID, name, price, quantity) VALUES (?, ?, ?, ?, ?)`,
        [orderID, item.productID, item.name, item.price, item.qty]
      );
      const orderItemID = itemResult.insertId;

      // Insert item options if any
      if (Array.isArray(item.options)) {
        for (const opt of item.options) {
          await conn.query(
            `INSERT INTO order_item_options (orderItemID, optionID) VALUES (?, ?)`,
            [orderItemID, opt.optionID]
          );
        }
      }

      // Reduce stock
      const [stockResult] = await conn.query(
        `UPDATE products SET stock = stock - ? WHERE productID = ? AND stock >= ?`,
        [item.qty, item.productID, item.qty]
      );

      if (stockResult.affectedRows === 0) {
        throw new Error(`Not enough stock for product ID ${item.productID}`);
      }
    }

    await conn.commit();
    res.json({ orderID });
  } catch (err) {
    await conn.rollback();
    console.error("Order creation error:", err);
    res.status(500).json({ message: "Failed to place order", error: err.message });
  } finally {
    conn.release();
  }
});

module.exports = router;
