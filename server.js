// include required packages
const express = require('express');
const mysql = require('mysql2/promise');
require('dotenv').config();

const port = 3000; // same port as your other server

// database config
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    waitForConnections: true,
    connectionLimit: 100,
    queueLimit: 0,
};

const app = express();
app.use(express.json());

app.listen(port, () => console.log(`Product server started on port ${port}`));

/* R = Read all products */
app.get('/products', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute(
            'SELECT * FROM defaultdb.Products'
        );
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Read error' });
    }
});

/* C = Create product */
app.post('/addproduct', async (req, res) => {
    const { card_name, card_price, card_status, card_image } = req.body;
    try {
        const connection = await mysql.createConnection(dbConfig);
        await connection.execute(
            'INSERT INTO defaultdb.Products (card_name, card_price, card_status, card_image) VALUES (?, ?, ?, ?)',
            [card_name, card_price, card_status, card_image]
        );
        res.status(201).json({ message: 'Product created' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Create error' });
    }
});

/* U = Update product */
app.put('/updateproduct/:id', async (req, res) => {
    const { id } = req.params;
    const { card_name, card_price, card_status, card_image } = req.body;
    try {
        const connection = await mysql.createConnection(dbConfig);
        await connection.execute(
            'UPDATE defaultdb.Products SET card_name = ?, card_price = ?, card_status = ?, card_image = ? WHERE id = ?',
            [card_name, card_price, card_status, card_image, id]
        );
        res.json({ message: 'Product updated' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Update error' });
    }
});

/* D = Delete product */
app.delete('/deleteproduct/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const connection = await mysql.createConnection(dbConfig);
        await connection.execute(
            'DELETE FROM defaultdb.Products WHERE id = ?',
            [id]
        );
        res.json({ message: 'Product deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Delete error' });
    }
});
