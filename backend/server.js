const express = require("express");
const cors = require("cors");
const path = require("path");
const session = require("express-session");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const productRoutes = require("./routes/products");
const cartRoutes = require("./routes/cart");
const dashboardRoutes = require("./routes/dashboard");

const app = express();

// CORS
const FRONTEND = process.env.FRONTEND_ORIGIN || "http://localhost:3000";
app.use(cors({
  origin: FRONTEND,
  credentials: true,
}));

// Log all incoming requests
app.use((req, res, next) => {
  console.log("➡️", req.method, req.url);
  next();
});

// JSON body parser (only for JSON requests, not form-data)
app.use(express.json({ type: "application/json" }));

// Serve uploads folder (optional)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Session
app.use(session({
  secret: process.env.SESSION_SECRET || "anime_secret",
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/dashboard", dashboardRoutes);

// Default route
app.get("/", (req, res) => res.send("Backend is running!"));

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
