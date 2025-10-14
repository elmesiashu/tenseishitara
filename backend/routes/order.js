const express = require("express");
const router = express.Router();
const db = require("../db"); // mysql2 pool

// ----------------- CREATE ORDER -----------------
router.post("/", async (req, res) => {
  const { userID, items, addressID, paymentID, total } = req.body;

  if (!userID || !items?.length) {
    return res.status(400).json({ message: "Invalid order: No user or items provided." });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // 1️⃣ Create the order
    const [orderResult] = await conn.query(
      `INSERT INTO orders (userID, addressID, paymentID, total, status, created_at) 
       VALUES (?, ?, ?, ?, 'Order Placed', NOW())`,
      [userID, addressID, paymentID, total]
    );
    const orderID = orderResult.insertId;

    // 2️⃣ Loop through each item
    for (const item of items) {
      if (!item.productID) throw new Error("Missing productID in order item");

      // ✅ Check stock
      const [stockRows] = await conn.query(
        `SELECT stock, productTitle FROM product WHERE productID = ?`,
        [item.productID]
      );
      if (!stockRows.length) throw new Error(`Product ID ${item.productID} not found`);
      if (stockRows[0].stock < item.qty) {
        throw new Error(`Not enough stock for "${stockRows[0].productTitle}" (ID ${item.productID})`);
      }

      // 3️⃣ Insert order item
      const [itemResult] = await conn.query(
        `INSERT INTO order_items (orderID, productID, name, price, quantity) 
         VALUES (?, ?, ?, ?, ?)`,
        [orderID, item.productID, item.name, item.price, item.qty]
      );
      const orderItemID = itemResult.insertId;

      // 4️⃣ Insert item options (if any)
      if (item.options?.length) {
        for (const opt of item.options) {
          if (!opt.optionID) continue;
          await conn.query(
            `INSERT INTO order_item_options (orderItemID, optionID) VALUES (?, ?)`,
            [orderItemID, opt.optionID]
          );
        }
      }

      // 5️⃣ Reduce stock
      await conn.query(
        `UPDATE product SET stock = stock - ? WHERE productID = ?`,
        [item.qty, item.productID]
      );
    }

    await conn.commit();
    res.json({ orderID });
  } catch (err) {
    await conn.rollback();
    console.error("Order creation failed:", err.message);
    res.status(500).json({ message: `Order creation failed: ${err.message}` });
  } finally {
    conn.release();
  }
});

module.exports = router;
