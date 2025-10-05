const express = require("express");
const cors = require("cors");
const path = require("path");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const productRoutes = require("./routes/products");
const cartRoutes = require("./routes/cart");
const dashboardRoutes = require("./routes/dashboard");

const app = express();

// FRONTEND ORIGIN
const FRONTEND = process.env.FRONTEND_ORIGIN || "http://localhost:3000";

// CORS
app.use(cors({
  origin: FRONTEND,
  credentials: true, // allow cookies
}));

// Required to read httpOnly cookies
app.use(cookieParser());

// Log incoming requests (for debugging)
app.use((req, res, next) => {
  console.log("➡️", req.method, req.url);
  next();
});

// Parse JSON bodies
app.use(express.json());

// Serve uploads folder
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

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
