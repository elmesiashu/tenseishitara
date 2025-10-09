const express = require("express");
const db = require("../db");
const router = express.Router();

// Get all addresses for a user
router.get("/:userID", (req, res) => {
  const { userID } = req.params;
  const sql = "SELECT * FROM addresses WHERE userID = ? ORDER BY is_primary DESC, created_at DESC";
  db.query(sql, [userID], (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});

// Add a new address
router.post("/", async (req, res) => {
  const {
    userID,
    fullName,
    country,
    address,
    unit,
    city,
    state,
    zipCde,
    phoneNum,
    is_primary = 0,
  } = req.body;

  if (!userID || !fullName || !country || !address || !city || !state || !zipCde || !phoneNum) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const connection = await db.promise().getConnection();
  try {
    await connection.beginTransaction();

    if (is_primary) {
      // Set all other addresses for this user to not primary
      await connection.query(
        "UPDATE addresses SET is_primary = 0 WHERE userID = ?",
        [userID]
      );
    }

    const [result] = await connection.query(
      `INSERT INTO addresses 
      (userID, fullName, country, address, unit, city, state, zipCde, phoneNum, is_primary, created_at) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [userID, fullName, country, address, unit, city, state, zipCde, phoneNum, is_primary]
    );

    await connection.commit();
    res.status(201).json({ message: "Address added", addressID: result.insertId });
  } catch (err) {
    await connection.rollback();
    console.error(err);
    res.status(500).json({ message: "Error adding address", error: err.message });
  } finally {
    connection.release();
  }
});

// Update an existing address by addressID
router.put("/:addressID", async (req, res) => {
  const { addressID } = req.params;
  const {
    fullName,
    country,
    address,
    unit,
    city,
    state,
    zipCde,
    phoneNum,
    is_primary = 0,
  } = req.body;

  const connection = await db.promise().getConnection();
  try {
    await connection.beginTransaction();

    if (is_primary) {
      // Set all other addresses for this user to not primary
      // Need userID first:
      const [rows] = await connection.query("SELECT userID FROM addresses WHERE addressID = ?", [addressID]);
      if (!rows.length) return res.status(404).json({ message: "Address not found" });

      const userID = rows[0].userID;
      await connection.query("UPDATE addresses SET is_primary = 0 WHERE userID = ?", [userID]);
    }

    await connection.query(
      `UPDATE addresses SET
      fullName = ?, country = ?, address = ?, unit = ?, city = ?, state = ?, zipCde = ?, phoneNum = ?, is_primary = ?
      WHERE addressID = ?`,
      [fullName, country, address, unit, city, state, zipCde, phoneNum, is_primary, addressID]
    );

    await connection.commit();
    res.json({ message: "Address updated" });
  } catch (err) {
    await connection.rollback();
    console.error(err);
    res.status(500).json({ message: "Error updating address", error: err.message });
  } finally {
    connection.release();
  }
});

// Set an address as primary
router.patch("/:addressID/set-primary", async (req, res) => {
  const { addressID } = req.params;
  const connection = await db.promise().getConnection();

  try {
    await connection.beginTransaction();

    // Get userID for this address
    const [rows] = await connection.query("SELECT userID FROM addresses WHERE addressID = ?", [addressID]);
    if (!rows.length) return res.status(404).json({ message: "Address not found" });

    const userID = rows[0].userID;

    // Reset other addresses
    await connection.query("UPDATE addresses SET is_primary = 0 WHERE userID = ?", [userID]);

    // Set this address primary
    await connection.query("UPDATE addresses SET is_primary = 1 WHERE addressID = ?", [addressID]);

    await connection.commit();
    res.json({ message: "Primary address updated" });
  } catch (err) {
    await connection.rollback();
    console.error(err);
    res.status(500).json({ message: "Error setting primary address", error: err.message });
  } finally {
    connection.release();
  }
});

module.exports = router;
