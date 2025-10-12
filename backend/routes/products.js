const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const db = require("../db");
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
  { name: "optionImage", maxCount: 20 },
]);

// ----------------- SKU generator -----------------
function generateSKU() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return Array.from({ length: 8 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join("");
}

// ----------------- GET all products -----------------
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
      productImage: p.productImage ? `/uploads/${p.productImage}` : null,
      discountedPrice: (p.listPrice * (1 - discount)).toFixed(2),
      hasOptions: !!p.hasOptions,
    }));

    res.json(products);
  } catch (err) {
    console.error("Error fetching products:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ----------------- UPLOAD product -----------------
router.post("/upload", cpUpload, async (req, res) => {
  try {
    const { productTitle, anime, productDescription, listPrice, stock, category, options } = req.body;

    if (!req.files || !req.files.productImage) 
      return res.status(400).json({ message: "Main image required" });

    const sku = generateSKU();
    const filename = req.files.productImage[0].filename;

    const [result] = await db.query(
      `INSERT INTO product
       (productSKU, productTitle, anime, productDescription, listPrice, stock, categoryID, productImage)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [sku, productTitle, anime, productDescription, listPrice, stock, category, filename]
    );

    const productID = result.insertId;

    // Insert product options
    const optionsArray = options ? JSON.parse(options) : [];
    if (req.files.optionImage) {
      await Promise.all(req.files.optionImage.map(async (file, idx) => {
        const opt = optionsArray[idx];
        if (opt) {
          await db.query(
            `INSERT INTO product_options (productID, optionName, optionValue, optionImage)
             VALUES (?, ?, ?, ?)`,
            [productID, opt.optionName, opt.optionValue, file.filename]
          );
        }
      }));
    }

    res.json({ message: "✅ Product uploaded successfully", productID });
  } catch (err) {
    console.error("Upload failed:", err);
    res.status(500).json({ message: "Upload failed", error: err.message });
  }
});

// ----------------- GET categories with image -----------------
router.get("/categories-with-image", async (req, res) => {
  try {
    const [categories] = await db.query("SELECT categoryID, categoryName FROM category");

    const categoriesWithImages = await Promise.all(
      categories.map(async (cat) => {
        const [products] = await db.query(
          "SELECT productImage FROM product WHERE categoryID = ? ORDER BY RAND() LIMIT 1",
          [cat.categoryID]
        );

        const productImage = products[0]?.productImage
          ? `/uploads/${products[0].productImage}`
          : "/uploads/default.png";

        return { ...cat, productImage };
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
  const discount = 0.3;

  try {
    const [products] = await db.query(
      `SELECT p.productID, p.productTitle, p.productDescription, p.listPrice, p.stock, p.productImage,
              c.categoryID, c.categoryName
       FROM product AS p
       INNER JOIN category AS c ON p.categoryID = c.categoryID
       WHERE p.productID = ?`,
      [productID]
    );

    if (!products.length) return res.status(404).json({ message: "Product not found" });

    const product = products[0];
    product.productImage = product.productImage ? `/uploads/${product.productImage}` : null;
    product.discountedPrice = (product.listPrice * (1 - discount)).toFixed(2);

    const [optionsRows] = await db.query(
      `SELECT optionName, optionValue, optionImage FROM product_options WHERE productID = ?`,
      [productID]
    );

    const options = optionsRows.map((opt) => ({
      optionName: opt.optionName,
      optionValue: opt.optionValue,
      preview: opt.optionImage ? `/uploads/${opt.optionImage}` : null,
    }));

    res.json({ product, options });
  } catch (err) {
    console.error("Error fetching product:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ----------------- GET products by category -----------------
router.get("/category/:categoryID", async (req, res) => {
  const { categoryID } = req.params;
  const discount = 0.3;

  try {
    const [rows] = await db.query(
      `SELECT p.productID, p.productTitle, p.productDescription, p.listPrice, p.stock, p.productImage,
              c.categoryID, c.categoryName
       FROM product AS p
       INNER JOIN category AS c ON p.categoryID = c.categoryID
       WHERE c.categoryID = ?`,
      [categoryID]
    );

    const products = rows.map((p) => ({
      ...p,
      productImage: p.productImage ? `/uploads/${p.productImage}` : null,
      discountedPrice: (p.listPrice * (1 - discount)).toFixed(2),
    }));

    res.json(products);
  } catch (err) {
    console.error("Error fetching products by category:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ----------------- GET bundle packages -----------------
router.get("/packages", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT p.productID, p.productTitle, p.listPrice, p.productImage,
             a.animeID, a.animeName
      FROM product AS p
      INNER JOIN anime AS a ON p.anime = a.animeID
    `);

    const animeGroups = {};
    rows.forEach(p => {
      if (!animeGroups[p.animeID]) animeGroups[p.animeID] = [];
      animeGroups[p.animeID].push(p);
    });

    const packages = [];

    for (const animeID in animeGroups) {
      const group = animeGroups[animeID];
      if (group.length >= 2) {
        const selectedItems = group.slice(0, 3);
        const total = selectedItems.reduce((sum, i) => sum + parseFloat(i.listPrice || 0), 0);
        const discountRate = 0.15;
        const discountedPrice = +(total * (1 - discountRate)).toFixed(2);

        const mainImage = selectedItems.find(i => i.productImage)?.productImage || "default.png";

        packages.push({
          animeID: parseInt(animeID),
          animeName: selectedItems[0].animeName,
          items: selectedItems,
          price: discountedPrice,
          original: +total.toFixed(2),
          discountPercent: Math.round(discountRate * 100),
          image: `/uploads/${mainImage}`,
        });
      }
    }

    res.json(packages);
  } catch (err) {
    console.error("Error fetching packages:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
