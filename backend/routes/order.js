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

    // Create the order
    const [orderResult] = await conn.query(
      `INSERT INTO orders (userID, addressID, paymentID, total, status, created_at)
       VALUES (?, ?, ?, ?, 'Order Placed', NOW())`,
      [userID, addressID, paymentID, total]
    );
    const orderID = orderResult.insertId;

    // Loop through each item
    for (const item of items) {
      if (!item.productID) throw new Error("Missing productID in order item");

      // Check stock
      const [stockRows] = await conn.query(
        `SELECT stock, productTitle FROM products WHERE productID = ?`,
        [item.productID]
      );
      if (!stockRows.length) throw new Error(`Product ID ${item.productID} not found`);
      if (stockRows[0].stock < item.qty) {
        throw new Error(`Not enough stock for "${stockRows[0].productTitle}"`);
      }

      // Insert order item
      const [itemResult] = await conn.query(
        `INSERT INTO order_items (orderID, productID, name, price, quantity)
         VALUES (?, ?, ?, ?, ?)`,
        [orderID, item.productID, item.name, item.price, item.qty]
      );
      const orderItemID = itemResult.insertId;

      // Insert item options (if any)
      if (item.options?.length) {
        for (const opt of item.options) {
          if (!opt.optionID) continue;
          await conn.query(
            `INSERT INTO order_item_options (orderItemID, optionID) VALUES (?, ?)`,
            [orderItemID, opt.optionID]
          );
        }
      }

      // Reduce stock
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

// ----------------- GET ORDER BY ID (with items + options) -----------------
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  const conn = await db.getConnection();
  try {
    // Get order
    const [orders] = await conn.query("SELECT * FROM orders WHERE orderID = ?", [id]);
    if (!orders.length) return res.status(404).json({ message: "Order not found" });

    const order = orders[0];

    // Get order items
    const [itemsRows] = await conn.query(
      `SELECT oi.*, 
              GROUP_CONCAT(oio.optionID) AS optionIDs
       FROM order_items oi
       LEFT JOIN order_item_options oio ON oi.orderItemID = oio.orderItemID
       WHERE oi.orderID = ?
       GROUP BY oi.orderItemID`,
      [id]
    );

    //  Convert optionIDs to array
    const items = itemsRows.map((item) => ({
      orderItemID: item.orderItemID,
      productID: item.productID,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      options: item.optionIDs
        ? item.optionIDs.split(",").map((optID) => ({ optionID: parseInt(optID) }))
        : [],
    }));

    order.items = items;

    // Optionally fetch address
    const [addresses] = await conn.query("SELECT * FROM addresses WHERE addressID = ?", [order.addressID]);
    order.address = addresses[0] || null;

    // Optionally fetch payment
    const [payments] = await conn.query("SELECT * FROM payments WHERE paymentID = ?", [order.paymentID]);
    order.payment = payments[0] || null;

    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch order" });
  } finally {
    conn.release();
  }
});

module.exports = router;
