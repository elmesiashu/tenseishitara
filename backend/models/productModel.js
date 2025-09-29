const db = require('./db');

const createProduct = (title, price, category, image, callback) => {
  db.query(
    'INSERT INTO products (title, price, category, image) VALUES (?, ?, ?, ?)',
    [title, price, category, image],
    callback
  );
};

const getAllProducts = (callback) => {
  db.query('SELECT * FROM products', callback);
};

module.exports = { createProduct, getAllProducts };
