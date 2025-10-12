const express = require("express");
const router = express.Router();
const db = require("../db"); 
const authMiddleware = require("../middleware/auth"); 

// ----------------- GET all addresses -----------------
router.get("/", authMiddleware, async (req, res) => {
  try {
    const userID = req.user.userID;
    const [addresses] = await db.query("SELECT * FROM addresses WHERE userID = ?", [userID]);
    res.json(addresses);
  } catch (err) {
    console.error("GET ADDRESSES error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ----------------- CREATE new address -----------------
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { fullName, country, address, unit, city, state, zipCode, phoneNum, is_primary = 0 } = req.body;
    const userID = req.user.userID;

    if (!fullName || !country || !address || !city || !state || !zipCode || !phoneNum) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (is_primary) {
      await db.query("UPDATE addresses SET is_primary = 0 WHERE userID = ?", [userID]);
    }

    const [result] = await db.query(
      `INSERT INTO addresses (userID, fullName, country, address, unit, city, state, zipCode, phoneNum, is_primary, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [userID, fullName, country, address, unit, city, state, zipCode, phoneNum, is_primary]
    );

    res.status(201).json({ addressID: result.insertId });
  } catch (err) {
    console.error("POST ADDRESS error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ----------------- SET PRIMARY address -----------------
router.post("/:id/primary", authMiddleware, async (req, res) => {
  const addressID = req.params.id;
  const userID = req.user.userID;

  try {
    // Reset all to not primary
    await db.query("UPDATE addresses SET is_primary = 0 WHERE userID = ?", [userID]);

    // Set selected as primary
    await db.query("UPDATE addresses SET is_primary = 1 WHERE addressID = ? AND userID = ?", [addressID, userID]);

    res.json({ message: "Primary address updated." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to set primary address." });
  }
});


module.exports = router;
