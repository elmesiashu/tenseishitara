const { createProduct, getAllProducts } = require('../models/productModel');

const addProduct = (req, res) => {
  const { title, price, category } = req.body;
  const image = req.file ? req.file.filename : null;

  createProduct(title, price, category, image, (err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ message: 'Product added successfully' });
  });
};

const listProducts = (req, res) => {
  getAllProducts((err, products) => {
    if (err) return res.status(500).json({ error: err });
    res.json(products);
  });
};

module.exports = { addProduct, listProducts };
