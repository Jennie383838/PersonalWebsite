// server.js
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors'); // <-- add CORS
require('dotenv').config();

const port = 4000;

// Database config
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,       // <-- fixed syntax
    connectionLimit: 10,
    queueLimit: 0,
};

// Create pool for better performance
const pool = mysql.createPool(dbConfig);

const app = express();
app.use(express.json());
app.use(cors()); // <-- allow cross-origin requests from React

// Simple test route
app.get('/', (req, res) => res.send('API is running'));

// R = Read all products
app.get('/products', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM Products'); // table name only
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Read error' });
    }
});

// C = Create product
app.post('/products', async (req, res) => {
    const { card_name, card_price, card_status, card_image } = req.body;
    try {
        await pool.execute(
            `INSERT INTO Products (card_name, card_price, card_status, card_image)
             VALUES (?, ?, ?, ?)`,
            [card_name, card_price, card_status, card_image]
        );
        res.status(201).json({ message: 'Created' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Create error' });
    }
});

// U = Update product
app.put('/products/:id', async (req, res) => {
    const { id } = req.params;
    const { card_name, card_price, card_status, card_image } = req.body;
    try {
        await pool.execute(
            `UPDATE Products
             SET card_name = ?, card_price = ?, card_status = ?, card_image = ?
             WHERE ID = ?`,
            [card_name, card_price, card_status, card_image, id]
        );
        res.json({ message: 'Updated' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Update error' });
    }
});

// D = Delete product
app.delete('/products/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.execute('DELETE FROM Products WHERE ID = ?', [id]);
        res.json({ message: 'Deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Delete error' });
    }
});

app.listen(port, () => console.log(`Server running on port ${port}`));
