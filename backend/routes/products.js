const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const db = require("../db"); // MySQL connection
const multer = require("multer");

// ----------------- Upload folder -----------------
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// ----------------- Multer setup -----------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});

const upload = multer({ storage });

// Accept multiple fields: main image + option images
const cpUpload = upload.fields([
  { name: "productImage", maxCount: 1 },
  { name: "optionImage", maxCount: 20 }, // max number of option images
]);

// ----------------- SKU generator -----------------
function generateSKU() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let sku = "";
  for (let i = 0; i < 8; i++) sku += chars.charAt(Math.floor(Math.random() * chars.length));
  return sku;
}

// ----------------- GET products -----------------
router.get("/", async (req, res) => {
  const keyword = req.query.keyword || "";
  const discount = 0.3;

  try {
    const [rows] = await db.query(
      `SELECT 
         p.productID, p.productSKU, p.productTitle, p.productDescription, p.listPrice, p.stock, p.productImage,
         c.categoryID, c.categoryName,
         a.animeID, a.animeName,
         EXISTS(SELECT 1 FROM product_options po WHERE po.productID = p.productID) AS hasOptions
       FROM product AS p
       INNER JOIN category AS c ON p.categoryID = c.categoryID
       INNER JOIN anime AS a ON p.anime = a.animeID
       WHERE p.productTitle LIKE ? OR c.categoryName LIKE ? OR a.animeName LIKE ?`,
      [`%${keyword}%`, `%${keyword}%`, `%${keyword}%`]
    );

    const products = rows.map((p) => ({
      ...p,
      productImage: p.productImage ? `/uploads/${p.productImage}` : null, // Full path for frontend
      discountedPrice: (p.listPrice * (1 - discount)).toFixed(2),
      hasOptions: !!p.hasOptions, // Convert from 0/1 to boolean
    }));

    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ----------------- UPLOAD product -----------------
router.post("/upload", cpUpload, async (req, res) => {
  console.log("=== /upload route HIT ===");
  console.log("req.body:", req.body);
  console.log("req.files:", req.files);

  try {
    const { productTitle, anime, productDescription, listPrice, stock, category, options } = req.body;

    if (!req.files || !req.files.productImage) 
      return res.status(400).json({ message: "Main image required" });

    const sku = generateSKU();
    const filename = req.files.productImage[0].filename;

    // Insert product
    const [result] = await db.query(
      `INSERT INTO product
       (productSKU, productTitle, anime, productDescription, listPrice, stock, categoryID, productImage)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [sku, productTitle, anime, productDescription, listPrice, stock, category, filename]
    );

    const productID = result.insertId;

    // Insert product options with images
    const optionsArray = options ? JSON.parse(options) : [];
    if (req.files.optionImage) {
      req.files.optionImage.forEach((file, idx) => {
        const opt = optionsArray[idx];
        if (opt) {
          db.query(
            `INSERT INTO product_options (productID, optionName, optionValue, optionImage)
             VALUES (?, ?, ?, ?)`,
            [productID, opt.optionName, opt.optionValue, file.filename]
          );
        }
      });
    }

    res.json({ message: "✅ Product uploaded successfully", productID });
  } catch (err) {
    console.error("Upload failed:", err);
    res.status(500).json({ message: "Upload failed" });
  }
});

// ----------------- DELETE product -----------------
router.delete("/:id", async (req, res) => {
  const productID = req.params.id;
  try {
    await db.query("DELETE FROM product WHERE productID=?", [productID]);
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});


// ----------------- GET bundle packages -----------------
router.get("/packages", async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT 
         p.productID, p.productTitle, p.listPrice, p.productImage,
         a.animeID, a.animeName
       FROM product AS p
       INNER JOIN anime AS a ON p.anime = a.animeID`
    );

    // Group by anime
    const animeGroups = {};
    rows.forEach((p) => {
      if (!animeGroups[p.animeID]) animeGroups[p.animeID] = [];
      animeGroups[p.animeID].push(p);
    });

    // Build bundles
    const packages = [];
    Object.keys(animeGroups).forEach((animeId) => {
      const group = animeGroups[animeId];

      const hoodie = group.find((g) =>
        g.productTitle.toLowerCase().includes("hoodie")
      );
      const tshirt = group.find((g) =>
        g.productTitle.toLowerCase().includes("t-shirt") ||
        g.productTitle.toLowerCase().includes("tshirt")
      );
      const pants = group.find((g) =>
        g.productTitle.toLowerCase().includes("pants")
      );

      if (hoodie && tshirt && pants) {
        const total =
          parseFloat(hoodie.listPrice) +
          parseFloat(tshirt.listPrice) +
          parseFloat(pants.listPrice);

        const discountRate = 0.15; // 15% package discount
        const discount = total * discountRate;
        const bundlePrice = (total - discount).toFixed(2);

        packages.push({
          animeId,
          animeName: hoodie.productTitle.split(" ")[0], // crude way to extract anime name
          items: [hoodie, tshirt, pants],
          price: bundlePrice,
          original: total.toFixed(2),
          discountPercent: discountRate * 100,
          image: hoodie.productImage
            ? `/uploads/${hoodie.productImage}`
            : "/uploads/default.png",
        });
      }
    });

    res.json(packages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ----------------- GET categories with random product image -----------------
router.get("/categories-with-image", async (req, res) => {
  try {
    // 1. Get all categories
    const [categories] = await db.query("SELECT categoryID, categoryName FROM category");

    // 2. For each category, get one random product image
    const categoriesWithImages = await Promise.all(
      categories.map(async (cat) => {
        const [products] = await db.query(
          "SELECT productImage FROM product WHERE categoryID = ? ORDER BY RAND() LIMIT 1",
          [cat.categoryID]
        );

        const productImage = products[0]?.productImage
          ? `/uploads/${products[0].productImage}`
          : "/uploads/default.png"; // fallback image

        return {
          ...cat,
          productImage
        };
      })
    );

    res.json(categoriesWithImages);
  } catch (err) {
    console.error("Error fetching categories with image:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ----------------- GET single product by ID -----------------
router.get("/:id", async (req, res) => {
  const productID = req.params.id;
  const discount = 0.3; // 30% off

  try {
    // Fetch product info
    const [products] = await db.query(
      `SELECT productID, productTitle, productDescription, listPrice, stock, productImage 
       FROM product WHERE productID = ?`,
      [productID]
    );

    if (products.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    const product = products[0];
    product.productImage = product.productImage ? `/uploads/${product.productImage}` : null;
    product.discountedPrice = (product.listPrice * (1 - discount)).toFixed(2);

    // Fetch options for this product
    const [optionsRows] = await db.query(
      `SELECT optionName, optionValue, optionImage FROM product_options WHERE productID = ?`,
      [productID]
    );

    const options = optionsRows.map(opt => ({
      optionName: opt.optionName,
      optionValue: opt.optionValue,
      preview: opt.optionImage ? `/uploads/${opt.optionImage}` : null
    }));

    res.json({ product, options });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
