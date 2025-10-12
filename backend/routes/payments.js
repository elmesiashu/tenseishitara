const express = require("express");
const router = express.Router();
const db = require("../db"); 
const authMiddleware = require("../middleware/auth"); // JWT middleware

// ----------------- GET all payments -----------------
router.get("/", authMiddleware, async (req, res) => {
  try {
    const userID = req.user.userID;
    const [payments] = await db.query("SELECT * FROM payments WHERE userID = ?", [userID]);
    res.json(payments);
  } catch (err) {
    console.error("GET PAYMENTS error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ----------------- CREATE new payment -----------------
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { cardName, cardNum_last4, expiryDate, is_primary = 0 } = req.body;
    const userID = req.user.userID;

    if (!cardName || !cardNum_last4 || !expiryDate) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (is_primary) {
      await db.query("UPDATE payments SET is_primary = 0 WHERE userID = ?", [userID]);
    }

    const [result] = await db.query(
      `INSERT INTO payments (userID, cardName, cardNum_last4, expiryDate, is_primary, created_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [userID, cardName, cardNum_last4, expiryDate, is_primary]
    );

    res.status(201).json({ message: "Payment added", paymentID: result.insertId });
  } catch (err) {
    console.error("POST PAYMENT error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ----------------- Set Primary Payment -----------------
router.post("/:id/primary", authMiddleware, async (req, res) => {
  const paymentID = req.params.id;
  const userID = req.user.userID;

  try {
    // Reset all to not primary
    await db.query("UPDATE payments SET is_primary = 0 WHERE userID = ?", [userID]);

    // Set selected as primary
    await db.query("UPDATE payments SET is_primary = 1 WHERE paymentID = ? AND userID = ?", [paymentID, userID]);

    res.json({ message: "Primary payment updated." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to set primary payment." });
  }
});


module.exports = router;
