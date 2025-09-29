const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(bodyParser.json());
app.use(cors());

const JWT_SECRET = "your_jwt_secret";

// --- User Authentication ---

// Register
app.post('/register', async (req, res) => {
    const { username, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    db.query('INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
        [username, email, hashedPassword],
        (err, result) => {
            if(err) return res.status(500).json({ error: err.message });
            res.json({ message: 'User registered successfully!' });
        }
    );
});

// Login
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
        if(err) return res.status(500).json({ error: err.message });
        if(results.length === 0) return res.status(404).json({ error: 'User not found' });

        const user = results[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if(!isMatch) return res.status(401).json({ error: 'Invalid password' });

        const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '1h' });
        res.json({ message: 'Login successful', token, user: { id: user.id, username: user.username } });
    });
});

// --- Middleware to Authenticate JWT ---
function authenticateToken(req, res, next) {
    const token = req.headers['authorization']?.split(' ')[1];
    if(!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if(err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}

// --- Products CRUD ---

// Get All Products
app.get('/products', (req, res) => {
    db.query('SELECT * FROM products', (err, results) => {
        if(err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// Add Product
app.post('/products', authenticateToken, (req, res) => {
    const { name, description, price, quantity, image_url } = req.body;
    db.query('INSERT INTO products (name, description, price, quantity, image_url) VALUES (?, ?, ?, ?, ?)',
        [name, description, price, quantity, image_url],
        (err, result) => {
            if(err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Product added successfully!' });
        }
    );
});

// --- Cart ---

// Add to Cart
app.post('/cart', authenticateToken, (req, res) => {
    const { product_id, quantity } = req.body;
    db.query('INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)',
        [req.user.id, product_id, quantity],
        (err, result) => {
            if(err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Product added to cart!' });
        }
    );
});

// Get User Cart
app.get('/cart', authenticateToken, (req, res) => {
    db.query(
        `SELECT cart.id, products.name, products.price, cart.quantity, (products.price * cart.quantity) as total
         FROM cart JOIN products ON cart.product_id = products.id
         WHERE cart.user_id = ?`,
         [req.user.id],
         (err, results) => {
             if(err) return res.status(500).json({ error: err.message });
             res.json(results);
         }
    );
});

// Checkout
app.post('/checkout', authenticateToken, (req, res) => {
    db.query(
        `SELECT products.id, products.price, cart.quantity 
         FROM cart JOIN products ON cart.product_id = products.id 
         WHERE cart.user_id = ?`, [req.user.id],
         (err, cartItems) => {
             if(err) return res.status(500).json({ error: err.message });

             const total = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

             // Create Order
             db.query('INSERT INTO orders (user_id, total_price) VALUES (?, ?)', [req.user.id, total],
                 (err, orderResult) => {
                     if(err) return res.status(500).json({ error: err.message });

                     const orderId = orderResult.insertId;

                     // Insert order items
                     cartItems.forEach(item => {
                         db.query('INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
                             [orderId, item.id, item.quantity, item.price]);
                     });

                     // Clear Cart
                     db.query('DELETE FROM cart WHERE user_id = ?', [req.user.id]);

                     res.json({ message: 'Checkout successful', order_id: orderId, total });
                 }
             );
         }
    );
});

// --- Server ---
app.listen(5000, () => console.log('Server running on port 5000'));
