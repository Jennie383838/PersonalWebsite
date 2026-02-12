// =======================
// Required packages
// =======================
const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const allowedOrigins = [
    "http://localhost:3000",
    "https://personalwebsite-1-ngee.onrender.com",
    "https://ramis-dreamland-avrq.vercel.app",
];

app.use(
    cors({
        origin(origin, callback) {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(null, false);
            }
        },
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
    port: process.env.DB_PORT,
});

// =======================
// Health Check
// =======================
app.get("/", (req, res) => {
    res.send("Product API is running");
});

// =======================
// PRODUCTS ROUTES
// =======================
app.get("/products", async (req, res) => {
    try {
        const [rows] = await pool.execute("SELECT * FROM Products");
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Read error" });
    }
});

app.post("/products", async (req, res) => {
    const { card_name, card_price, card_status, card_image } = req.body;

    if (!card_name || !card_price) {
        return res.status(400).json({ message: "Missing fields" });
    }

    try {
        await pool.execute(
            `INSERT INTO Products 
       (card_name, card_price, card_status, card_image) 
       VALUES (?, ?, ?, ?)`,
            [card_name, card_price, card_status, card_image]
        );

        res.status(201).json({ message: "Product created" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Create error" });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server started on port ${PORT}`);
});
