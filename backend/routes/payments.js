const express = require("express");
const router = express.Router();
const db = require("../db");
const authMiddleware = require("../middleware/auth"); // JWT middleware

// ----------------- GET all payments -----------------
router.get("/", authMiddleware, async (req, res) => {
  try {
    const userID = req.user.userID;
    const [payments] = await db.query(
      "SELECT paymentID, cardName, cardNum_last4, expiryDate, is_primary, created_at, cardNum FROM payments WHERE userID = ?",
      [userID]
    );

    // Map card type
    const paymentsWithType = payments.map(p => {
      let cardType = null;
      if (p.cardNum?.startsWith("4")) cardType = "visa";
      else if (/^5[1-5]/.test(p.cardNum)) cardType = "mastercard";
      return { ...p, cardType };
    });

    // Remove full card number before sending to frontend
    paymentsWithType.forEach(p => delete p.cardNum);

    res.json(paymentsWithType);
  } catch (err) {
    console.error("GET PAYMENTS error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ----------------- CREATE new payment -----------------
router.post("/", authMiddleware, async (req, res) => {
  try {
    let { cardName, cardNum, cvv, expiryDate, is_primary = 0 } = req.body;
    const userID = req.user.userID;

    if (!cardName || !cardNum || !cvv || !expiryDate) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Card type validation (Visa/MC)
    const isVisa = /^4/.test(cardNum);
    const isMastercard = /^5[1-5]/.test(cardNum);
    if (!isVisa && !isMastercard) {
      return res.status(400).json({ message: "Only Visa or MasterCard are accepted." });
    }

    if (!/^\d{16}$/.test(cardNum)) {
      return res.status(400).json({ message: "Card number must be 16 digits." });
    }

    if (!/^\d{3}$/.test(cvv)) {
      return res.status(400).json({ message: "CVV must be 3 digits." });
    }

    const cardNum_last4 = cardNum.slice(-4);

    // If new card is primary, unset all others
    if (is_primary) {
      await db.query("UPDATE payments SET is_primary = 0 WHERE userID = ?", [userID]);
    }

    const [result] = await db.query(
      `INSERT INTO payments (userID, cardName, cardNum_last4, cardNum, cvv, expiryDate, is_primary, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [userID, cardName, cardNum_last4, cardNum, cvv, expiryDate, is_primary]
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
    await db.query("UPDATE payments SET is_primary = 0 WHERE userID = ?", [userID]);
    await db.query("UPDATE payments SET is_primary = 1 WHERE paymentID = ? AND userID = ?", [paymentID, userID]);
    res.json({ message: "Primary payment updated." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to set primary payment." });
  }
});

// ----------------- DELETE payment -----------------
router.delete("/:id", authMiddleware, async (req, res) => {
  const paymentID = req.params.id;
  const userID = req.user.userID;

  try {
    const [result] = await db.query(
      "DELETE FROM payments WHERE paymentID = ? AND userID = ?",
      [paymentID, userID]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Payment not found or not authorized" });
    }

    res.json({ message: "Payment deleted successfully" });
  } catch (err) {
    console.error("DELETE PAYMENT error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
