const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
const path = require("path");

const authRoutes = require("./routes/auth");
const productRoutes = require("./routes/products"); // ✅ import products

dotenv.config();
const app = express();

// ---------- Middleware ----------
app.use(express.json());
app.use(cookieParser());

// ---------- Static Folder ----------
app.use("/uploads", express.static(path.join(__dirname, "uploads"))); // ✅ serve images

// ---------- CORS ----------
const allowedOrigins = [
  process.env.FRONTEND_ORIGIN || "https://tenseishitara.vercel.app",
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true, // ✅ allows cookies to be sent cross-origin
  })
);

// ---------- Routes ----------
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);

// ---------- Test route ----------
app.get("/", (req, res) => res.send("Backend running successfully!"));

// ---------- Start server ----------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
