// =======================
// Required packages
// =======================
const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");
require("dotenv").config();

// =======================
// App & Port
// =======================
const app = express();
const PORT = process.env.PORT || 3000; // NOT 3000

// =======================
// Middleware
// =======================
app.use(express.json());

const allowedOrigins = [
    "http://localhost:3000",
    "https://personalwebsite-1-ngee.onrender.com",
];

app.use(
    cors({
        origin(origin, callback) {
            // allow requests with no origin (Postman, curl)
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(null, false);
            }
        },
        methods: ["GET", "POST", "PUT", "DELETE"],
        allowedHeaders: ["Content-Type", "Authorization"],
    })
);

// =======================
// MySQL Connection Pool
// =======================
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

// =======================
// Health Check (important)
// =======================
app.get("/", (req, res) => {
    res.send("✅ Product API is running");
});

// =======================
// R = Read all products
// =======================
app.get("/products", async (req, res) => {
    try {
        const [rows] = await pool.execute(
            "SELECT * FROM Products"
        );
        res.json(rows);
    } catch (err) {
        console.error("READ ERROR:", err);
        res.status(500).json({ message: "Read error" });
    }
});

// =======================
// C = Create product
// =======================
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
        console.error("CREATE ERROR:", err);
        res.status(500).json({ message: "Create error" });
    }
});

// =======================
// U = Update product
// =======================
app.put("/products/:id", async (req, res) => {
    const { id } = req.params;
    const { card_name, card_price, card_status, card_image } = req.body;

    try {
        await pool.execute(
            `UPDATE Products 
       SET card_name=?, card_price=?, card_status=?, card_image=? 
       WHERE id=?`,
            [card_name, card_price, card_status, card_image, id]
        );

        res.json({ message: "Product updated" });
    } catch (err) {
        console.error("UPDATE ERROR:", err);
        res.status(500).json({ message: "Update error" });
    }
});

// =======================
// D = Delete product
// =======================
app.delete("/products/:id", async (req, res) => {
    const { id } = req.params;

    try {
        await pool.execute(
            "DELETE FROM Products WHERE id = ?",
            [id]
        );

        res.json({ message: "Product deleted" });
    } catch (err) {
        console.error("DELETE ERROR:", err);
        res.status(500).json({ message: "Delete error" });
    }
});

// =======================
// Start Server
// =======================
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
