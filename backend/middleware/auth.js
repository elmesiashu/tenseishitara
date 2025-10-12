const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "secret";

function authMiddleware(req, res, next) {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ error: "No token" });

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

module.exports = authMiddleware;
