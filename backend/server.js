// ---------- Imports ----------
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
const path = require("path");
const session = require("express-session");

const authRoutes = require("./routes/auth");
const productRoutes = require("./routes/products");

dotenv.config();
const app = express();

// ---------- Middleware ----------
app.use(express.json());
app.use(cookieParser());

// ---------- Static Folder ----------
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ---------- CORS ----------
const allowedOrigins = [
  process.env.FRONTEND_ORIGIN || "https://tenseishitara.vercel.app",
  "http://localhost:5173", // Vite dev
  "http://localhost:3000", // CRA dev
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true, // allow cookies cross-origin
  })
);

// ---------- Session (optional but recommended if using sessions) ----------
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

// ---------- Routes ----------
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);

// ---------- Test route ----------
app.get("/", (req, res) => {
  res.send("Backend running successfully!");
});

// ---------- Start server ----------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
