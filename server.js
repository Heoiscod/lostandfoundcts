const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Secret key for JWT (keep this safe!)
const JWT_SECRET = "your_secret_key_here";

// ✅ MySQL connection
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "lost_and_found"
});

db.connect(err => {
  if (err) {
    console.error("Database connection failed:", err);
    return;
  }
  console.log("✅ Connected to MySQL Database");
});

// ✅ Route: Test API
app.get("/", (req, res) => {
  res.send("Lost and Found System Backend is running ✅");
});

// ==================== USER AUTH ====================

// ✅ Register Route
app.post("/register", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "All fields are required" });
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  const sql = "INSERT INTO users (username, password) VALUES (?, ?)";
  db.query(sql, [username, hashedPassword], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Registration failed" });
    }
    res.json({ message: "User registered successfully ✅" });
  });
});

// ✅ Login Route
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  const sql = "SELECT * FROM users WHERE username = ?";
  db.query(sql, [username], async (err, results) => {
    if (err) return res.status(500).json({ error: "Database error" });

    if (results.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = results[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Generate JWT Token
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, {
      expiresIn: "1h"
    });

    res.json({ message: "Login successful ✅", token });
  });
});

// ==================== LOST & RETURN ITEMS ====================

// ✅ Route: Add Lost Item
app.post("/lost", (req, res) => {
  const { item_name, description, location } = req.body;
  const sql = "INSERT INTO lost_items (item_name, description, location) VALUES (?, ?, ?)";
  db.query(sql, [item_name, description, location], (err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ message: "Lost item added successfully ✅", id: result.insertId });
  });
});

// ✅ Route: Add Returned Item
app.post("/return", (req, res) => {
  const { item_name, description, location } = req.body;
  const sql = "INSERT INTO return_items (item_name, description, location) VALUES (?, ?, ?)";
  db.query(sql, [item_name, description, location], (err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ message: "Returned item recorded successfully ✅", id: result.insertId });
  });
});

// ✅ Route: Fetch Lost Items
app.get("/lost", (req, res) => {
  db.query("SELECT * FROM lost_items", (err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results);
  });
});

// ✅ Route: Fetch Returned Items
app.get("/return", (req, res) => {
  db.query("SELECT * FROM return_items", (err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results);
  });
});

// ✅ Start server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
