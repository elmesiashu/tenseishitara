const express = require("express");
const router = express.Router();
const db = require("../db");
const crypto = require("crypto");
const authMiddleware = require("../middleware/auth"); 

// Generate unique order ID
function generateOrderID() {
  return `OD${Date.now()}`; // e.g., OD1697200000000
}

// Generate tracking number
function generateTrackingNumber() {
  const prefix = "BD";
  const number = crypto.randomInt(0, 999999999999).toString().padStart(12, "0");
  return `${prefix}${number}`; // e.g., BD045903594059
}

// ----------------- CREATE ORDER -----------------
router.post("/", async (req, res) => {
  const { userID, items, addressID, paymentID, total } = req.body;
  if (!userID || !items?.length) return res.status(400).json({ message: "Invalid order" });

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const orderID = generateOrderID();
    const trackingNumber = generateTrackingNumber();

    // Insert order
    await conn.query(
      `INSERT INTO orders 
       (orderID, userID, addressID, paymentID, total, status, created_at, trackingNumber)
       VALUES (?, ?, ?, ?, ?, 'Order Placed', NOW(), ?)`,
      [orderID, userID, addressID, paymentID, total, trackingNumber]
    );

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
        `UPDATE product SET stock = stock - ? WHERE productID = ? AND stock >= ?`,
        [item.qty, item.productID, item.qty]
      );

      if (stockResult.affectedRows === 0) {
        throw new Error(`Not enough stock for product ID ${item.productID}`);
      }
    }

    await conn.commit();
    res.json({ orderID, trackingNumber });
  } catch (err) {
    await conn.rollback();
    console.error("Order creation error:", err);
    res.status(500).json({ message: "Failed to place order", error: err.message });
  } finally {
    conn.release();
  }
});

// ----------------- GET ORDER BY ID -----------------
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  const conn = await db.getConnection();

  try {
    // Get order
    const [orders] = await conn.query("SELECT * FROM orders WHERE orderID = ?", [id]);
    if (!orders.length) return res.status(404).json({ message: "Order not found" });
    const order = orders[0];

    // Get order items + product info
    const [itemsRows] = await conn.query(
      `SELECT 
          oi.orderItemID,
          oi.productID,
          oi.name,
          oi.price,
          oi.quantity,
          p.productTitle,
          p.productImage,
          GROUP_CONCAT(oio.optionID) AS optionIDs
       FROM order_items oi
       LEFT JOIN product p ON oi.productID = p.productID
       LEFT JOIN order_item_options oio ON oi.orderItemID = oio.orderItemID
       WHERE oi.orderID = ?
       GROUP BY oi.orderItemID`,
      [id]
    );

    const items = itemsRows.map((item) => {
      let imageBase64 = "/images/placeholder.png";
      if (item.productImage) {
        const buffer = Buffer.from(item.productImage);
        imageBase64 = `data:image/jpeg;base64,${buffer.toString("base64")}`;
      }

      return {
        orderItemID: item.orderItemID,
        productID: item.productID,
        name: item.name || item.productTitle,
        price: item.price,
        quantity: item.quantity,
        image: imageBase64,
        options: item.optionIDs
          ? item.optionIDs.split(",").map((optID) => ({ optionID: parseInt(optID) }))
          : [],
      };
    });

    order.items = items;

    // Fetch address
    const [addresses] = await conn.query("SELECT * FROM addresses WHERE addressID = ?", [order.addressID]);
    order.address = addresses[0] || null;

    // Fetch payment
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

// ----------------- GET ALL ORDERS FOR A USER -----------------
router.get("/user", authMiddleware, async (req, res) => {
  try {
    const userID = req.user.id;
    const [rows] = await db.query("SELECT * FROM orders WHERE userID = ? ORDER BY created_at DESC", [userID]);
    const result = [];

    for (const order of rows) {
      const [items] = await db.query("SELECT * FROM order_items WHERE orderID = ?", [order.orderID]);
      result.push({ ...order, items });
    }

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error retrieving orders" });
  }
});

module.exports = router;
