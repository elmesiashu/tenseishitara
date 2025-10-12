const express = require("express");
const router = express.Router();
const db = require("../db");
const { v4: uuidv4 } = require("uuid");
const authMiddleware = require("../middleware/auth"); 

// ----------------- CREATE ORDER -----------------
router.post("/", authMiddleware, async (req, res) => {
  const { addressID, paymentID, items, total, newAddress, newPayment } = req.body;
  const userID = req.user.userID;

  if (!items || items.length === 0 || !total) {
    return res.status(400).json({ message: "Missing required fields or empty cart" });
  }

  const connection = await db.promise().getConnection();
  try {
    await connection.beginTransaction();

    let finalAddressID = addressID;
    let finalPaymentID = paymentID;

    // ----------------- CREATE NEW ADDRESS IF NEEDED -----------------
    if (addressID === "new") {
      const {
        fullName, country, address, unit, city, state, zipCode, phoneNum, is_primary = 0,
      } = newAddress || {};

      if (!fullName || !country || !address || !city || !state || !zipCode || !phoneNum) {
        throw new Error("Incomplete new address");
      }

      if (is_primary) {
        await connection.query("UPDATE addresses SET is_primary = 0 WHERE userID = ?", [userID]);
      }

      const [addrResult] = await connection.query(
        `INSERT INTO addresses (userID, fullName, country, address, unit, city, state, zipCode, phoneNum, is_primary, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [userID, fullName, country, address, unit, city, state, zipCode, phoneNum, is_primary]
      );
      finalAddressID = addrResult.insertId;
    }

    // ----------------- CREATE NEW PAYMENT IF NEEDED -----------------
    if (paymentID === "new") {
      const { cardName, cardNum_last4, expiryDate, is_primary = 0 } = newPayment || {};
      if (!cardName || !cardNum_last4 || !expiryDate) throw new Error("Incomplete new payment");

      if (is_primary) {
        await connection.query("UPDATE payments SET is_primary = 0 WHERE userID = ?", [userID]);
      }

      const [payResult] = await connection.query(
        `INSERT INTO payments (userID, cardName, cardNum_last4, expiryDate, is_primary, created_at)
         VALUES (?, ?, ?, ?, ?, NOW())`,
        [userID, cardName, cardNum_last4, expiryDate, is_primary]
      );
      finalPaymentID = payResult.insertId;
    }

    // ----------------- INSERT ORDER -----------------
    const [orderResult] = await connection.query(
      "INSERT INTO orders (userID, addressID, paymentID, total, status, created_at) VALUES (?, ?, ?, ?, 'pending', NOW())",
      [userID, finalAddressID, finalPaymentID, total]
    );
    const orderID = orderResult.insertId;

    // ----------------- INSERT ORDER ITEMS & OPTIONS -----------------
    for (const item of items) {
      const { productID, name, price, quantity, options } = item;

      const [productRows] = await connection.query("SELECT stock FROM product WHERE productID = ?", [productID]);
      if (!productRows.length) throw new Error(`Product not found: ${name}`);
      if (productRows[0].stock < quantity) throw new Error(`Not enough stock for ${name}`);

      const [itemResult] = await connection.query(
        "INSERT INTO order_items (orderID, productID, name, price, quantity) VALUES (?, ?, ?, ?, ?)",
        [orderID, productID, name, price, quantity]
      );
      const orderItemID = itemResult.insertId;

      if (options && options.length > 0) {
        for (const opt of options) {
          await connection.query(
            "INSERT INTO order_item_options (orderItemID, optionID) VALUES (?, ?)",
            [orderItemID, opt.optionID]
          );
        }
      }

      // Decrease stock
      await connection.query("UPDATE product SET stock = stock - ? WHERE productID = ?", [quantity, productID]);
    }

    await connection.commit();

    // ----------------- FETCH FULL ORDER INFO -----------------
    const [orderRows] = await connection.query(
      "SELECT * FROM orders WHERE orderID = ?",
      [orderID]
    );
    const order = orderRows[0];

    // Fetch items with options
    const [orderItems] = await connection.query("SELECT * FROM order_items WHERE orderID = ?", [orderID]);
    for (const item of orderItems) {
      const [options] = await connection.query(
        `SELECT o.optionID, ooption.optionName, ooption.optionValue
         FROM order_item_options o
         JOIN product_options ooption ON o.optionID = ooption.optionID
         WHERE o.orderItemID = ?`,
        [item.orderItemID]
      );
      item.options = options;
    }
    order.items = orderItems;

    // Fetch address
    const [addrRows] = await connection.query("SELECT * FROM addresses WHERE addressID = ?", [finalAddressID]);
    order.address = addrRows[0];

    // Fetch payment
    const [payRows] = await connection.query("SELECT * FROM payments WHERE paymentID = ?", [finalPaymentID]);
    order.payment = payRows[0];

    res.status(201).json({ message: "Order placed successfully", order });
  } catch (err) {
    await connection.rollback();
    console.error(err);
    res.status(400).json({ message: "Order failed", error: err.message });
  } finally {
    connection.release();
  }
});

// ----------------- GET ORDERS FOR LOGGED-IN USER -----------------
router.get("/user", authMiddleware, async (req, res) => {
  const userID = req.user.userID;

  try {
    const [orders] = await db.query("SELECT * FROM orders WHERE userID = ? ORDER BY created_at DESC", [userID]);

    for (const order of orders) {
      const [items] = await db.query("SELECT * FROM order_items WHERE orderID = ?", [order.orderID]);
      for (const item of items) {
        const [options] = await db.query(
          `SELECT o.optionID, ooption.optionName, ooption.optionValue
           FROM order_item_options o
           JOIN product_options ooption ON o.optionID = ooption.optionID
           WHERE o.orderItemID = ?`,
          [item.orderItemID]
        );
        item.options = options;
      }
      order.items = items;

      const [addr] = await db.query("SELECT * FROM addresses WHERE addressID = ?", [order.addressID]);
      order.address = addr[0];

      const [pay] = await db.query("SELECT * FROM payments WHERE paymentID = ?", [order.paymentID]);
      order.payment = pay[0];
    }

    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ----------------- GET SINGLE ORDER -----------------
router.get("/:orderID", authMiddleware, async (req, res) => {
  const { orderID } = req.params;

  try {
    const [orders] = await db.query("SELECT * FROM orders WHERE orderID = ?", [orderID]);
    if (!orders.length) return res.status(404).json({ message: "Order not found" });

    const order = orders[0];

    const [items] = await db.query("SELECT * FROM order_items WHERE orderID = ?", [orderID]);
    for (const item of items) {
      const [options] = await db.query(
        `SELECT o.optionID, ooption.optionName, ooption.optionValue
         FROM order_item_options o
         JOIN product_options ooption ON o.optionID = ooption.optionID
         WHERE o.orderItemID = ?`,
        [item.orderItemID]
      );
      item.options = options;
    }
    order.items = items;

    const [addr] = await db.query("SELECT * FROM addresses WHERE addressID = ?", [order.addressID]);
    order.address = addr[0];

    const [pay] = await db.query("SELECT * FROM payments WHERE paymentID = ?", [order.paymentID]);
    order.payment = pay[0];

    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;