// ---------- Imports ----------
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
const session = require("express-session");
const path = require("path");

// ---------- Routes ----------
const authRoutes = require("./routes/auth");
const productRoutes = require("./routes/products");
const dashboardRoutes = require("./routes/dashboard");
const orderRoutes = require("./routes/order");
const cartRoutes = require("./routes/cart");
const addressesRoutes = require("./routes/addresses");
const paymentsRoutes = require("./routes/payments");

// ---------- Config ----------
dotenv.config();
const app = express();

// ---------- Middleware ----------
app.use(express.json());
app.use(cookieParser());

// ---------- CORS ----------
const allowedOrigins = [
  process.env.FRONTEND_ORIGIN || "https://tenseishitara.vercel.app",
  "http://localhost:5173",
  "http://localhost:3000",
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true, // allow cookies cross-origin
  })
);

// ---------- Session ----------
app.use(
  session({
    secret: process.env.SESSION_SECRET || "secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    },
  })
);

// ---------- Static folder for uploads ----------
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ---------- API Routes ----------
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/order", orderRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/addresses", addressesRoutes);
app.use("/api/payments", paymentsRoutes);

// ---------- Test Route ----------
app.get("/", (req, res) => {
  res.send("Backend running successfully!");
});

// ---------- 404 for undefined API routes ----------
app.use("/api", (req, res) => {
  res.status(404).json({ message: "API route not found" });
});

// ---------- Start server ----------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`❥ Server running on port ${PORT}`));
