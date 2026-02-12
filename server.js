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
const PORT = process.env.PORT || 3000;

// =======================
// Middleware
// =======================
app.use(express.json());

const allowedOrigins = [
    "http://localhost:3000",
    "https://personalwebsite-1-ngee.onrender.com",
    "https://ramis-dreamland.vercel.app",
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
        console.error("READ ERROR:", err);
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
        console.error("CREATE ERROR:", err);
        res.status(500).json({ message: "Create error" });
    }
});

// =======================
// CREATE ORDER
// =======================
app.post("/orders", async (req, res) => {
    const { customer, cart, total } = req.body;

    if (!customer || !cart || cart.length === 0) {
        return res.status(400).json({ message: "Invalid order data" });
    }

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const [orderResult] = await connection.execute(
            `INSERT INTO Orders 
      (customer_name, customer_email, customer_phone, customer_address, total)
      VALUES (?, ?, ?, ?, ?)`,
            [
                customer.name,
                customer.email,
                customer.phone,
                customer.address,
                total,
            ]
        );

        const orderId = orderResult.insertId;

        for (const item of cart) {
            await connection.execute(
                `INSERT INTO OrderItems
        (order_id, product_id, product_name, product_price, quantity)
        VALUES (?, ?, ?, ?, ?)`,
                [
                    orderId,
                    item.id,
                    item.card_name,
                    item.card_price,
                    item.qty,
                ]
            );
        }

        await connection.commit();

        res.status(201).json({
            message: "Order saved successfully",
            orderId,
        });
    } catch (err) {
        await connection.rollback();
        console.error("ORDER ERROR:", err);
        res.status(500).json({ message: "Order save error" });
    } finally {
        connection.release();
    }
});

// =======================
// Start Server
// =======================
app.listen(PORT, () => {
    console.log(`🚀 Server started on port ${PORT}`);
});
