// =======================
// Required packages
// =======================
const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// =======================
// Middleware
// =======================
app.use(express.json());

const allowedOrigins = [
    "http://localhost:3000",
    "https://personalwebsite-1-ngee.onrender.com",
    "https://ramis-dreamland-avrq.vercel.app",
];

app.use(
    cors({
        origin: function (origin, callback) {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error("Not allowed by CORS"));
            }
        },
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
    })
);

// =======================
// MySQL Pool
// =======================
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT) || 3306,
    waitForConnections: true,
    connectionLimit: 100,
    queueLimit: 0,
});

// =======================
// Health Check
// =======================
app.get("/", (req, res) => {
    res.send("Product API is running");
});

// =======================
// GET ALL PRODUCTS
// =======================
app.get("/products", async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM Products");
        res.json(rows);
    } catch (err) {
        console.error("Error fetching products:", err);
        res.status(500).json({ message: "Server error - could not fetch products" });
    }
});

// =======================
// ADD PRODUCT
// =======================
app.post("/products", async (req, res) => {
    const { card_name, card_price, card_status, card_image } = req.body;

    if (!card_name || !card_price) {
        return res.status(400).json({ message: "card_name and card_price are required" });
    }

    try {
        await pool.query(
            `INSERT INTO Products 
            (card_name, card_price, card_status, card_image) 
            VALUES (?, ?, ?, ?)`,
            [card_name, card_price, card_status, card_image]
        );

        res.status(201).json({ message: "Product created successfully" });
    } catch (err) {
        console.error("Error creating product:", err);
        res.status(500).json({ message: "Server error - could not create product" });
    }
});

// =======================
// UPDATE PRODUCT
// =======================
app.put("/products/:id", async (req, res) => {
    const { id } = req.params;
    const { card_name, card_price, card_status, card_image } = req.body;

    if (!card_name || !card_price) {
        return res.status(400).json({ message: "card_name and card_price are required" });
    }

    try {
        const [result] = await pool.query(
            `UPDATE Products 
             SET card_name = ?, card_price = ?, card_status = ?, card_image = ?
             WHERE id = ?`,
            [card_name, card_price, card_status, card_image, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Product not found" });
        }

        res.json({
            message: "Product updated successfully",
            affectedRows: result.affectedRows,
        });
    } catch (err) {
        console.error("Error updating product:", err);
        res.status(500).json({ message: "Server error - could not update product" });
    }
});

// =======================
// DELETE PRODUCT
// =======================
app.delete("/products/:id", async (req, res) => {
    const { id } = req.params;

    try {
        const [result] = await pool.query(
            "DELETE FROM Products WHERE id = ?",
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Product not found" });
        }

        res.json({
            message: "Product deleted successfully",
            affectedRows: result.affectedRows,
        });
    } catch (err) {
        console.error("Error deleting product:", err);
        res.status(500).json({ message: "Server error - could not delete product" });
    }
});

// =======================
// Start Server
// =======================
app.listen(PORT, () => {
    console.log(`🚀 Server started on port ${PORT}`);
});