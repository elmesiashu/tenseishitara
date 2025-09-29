const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',         // Your MySQL username
    password: 'yourpass', // Your MySQL password
    database: 'tenseishitara'
});

db.connect(err => {
    if(err) throw err;
    console.log('Connected to tenseishitara database');
});

module.exports = db;
