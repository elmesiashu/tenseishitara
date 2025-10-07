const express = require("express");
const router = express.Router();
const pool = require("../db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");

const JWT_SECRET = process.env.JWT_SECRET || "secret";

function sendToken(res, user) {
  const token = jwt.sign(
    { userID: user.userID, email: user.email, isAdmin: !!user.isAdmin },
    JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.cookie("token", token, {
    httpOnly: true,
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    secure: process.env.NODE_ENV === "production",
  });

  const safeUser = {
    userID: user.userID,
    fname: user.fname,
    lname: user.lname,
    email: user.email,
    userImg: user.userImg,
    isAdmin: !!user.isAdmin,
  };

  res.json({ success: true, user: safeUser });
}

// ----------------- Register -----------------
router.post("/register", async (req, res) => {
  try {
    const { firstname, lastname, username, password } = req.body;
    if (!firstname || !lastname || !username || !password)
      return res.status(400).json({ error: "Missing fields" });

    const [rows] = await pool.query("SELECT userID FROM user WHERE email = ?", [username]);
    if (rows.length) return res.status(409).json({ error: "Email already in use" });

    const hashed = await bcrypt.hash(password, 10);
    const userID = uuidv4().replace(/-/g, "").slice(0, 11);
    const defaultImg = "/uploads/default.png";

    await pool.query(
      "INSERT INTO user (userID, fname, lname, email, password, userImg) VALUES (?, ?, ?, ?, ?, ?)",
      [userID, firstname, lastname, username, hashed, defaultImg]
    );

    sendToken(res, {
      userID,
      fname: firstname,
      lname: lastname,
      email: username,
      userImg: defaultImg,
      isAdmin: 0,
    });
  } catch (err) {
    console.error("REGISTER error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ----------------- Login -----------------
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ error: "Missing credentials" });

    const [rows] = await pool.query("SELECT * FROM user WHERE email = ?", [username]);
    const user = rows[0];
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    sendToken(res, user);
  } catch (err) {
    console.error("LOGIN error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ----------------- Check session -----------------
router.get("/me", async (req, res) => {
  try {
    const token = req.cookies?.token;
    if (!token) return res.status(401).json({ error: "No token" });

    const payload = jwt.verify(token, JWT_SECRET);
    const [rows] = await pool.query(
      "SELECT userID, fname, lname, email, userImg, isAdmin FROM user WHERE userID = ?",
      [payload.userID]
    );

    if (!rows.length) return res.status(404).json({ error: "User not found" });
    res.json({ user: rows[0] });
  } catch (err) {
    console.error("AUTH /me error:", err);
    res.status(401).json({ error: "Invalid or expired token" });
  }
});

// -----------------Logout-----------------
router.post("/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    secure: process.env.NODE_ENV === "production",
  });
  res.json({ success: true });
});

module.exports = router;
