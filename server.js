import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { supabase } from "./supabaseClient.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files (HTML, CSS, JS, images)
app.use(express.static(path.join(__dirname, "public")));

// Secret key for JWT
const JWT_SECRET = "your_secret_key_here";

/* ====================
   USER AUTH
==================== */

// Register Route
app.post("/register", async (req, res) => {
  const { name, username, email, password } = req.body;

  if (!name || !username || !email || !password)
    return res.status(400).json({ error: "All fields are required" });

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const { data, error } = await supabase
      .from("users")
      .insert([{ name, username, email, password: hashedPassword }]);

    if (error) throw error;

    res.json({ message: "User registered successfully ✅" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Registration failed" });
  }
});

// Login Route
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ error: "Email and password required" });

  try {
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (error || !user)
      return res.status(401).json({ error: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ message: "Login successful ✅", token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Login failed" });
  }
});

/* ====================
   LOST & RETURN ITEMS
==================== */

// Add Lost Item
app.post("/lost", async (req, res) => {
  const { item_name, description, location } = req.body;

  try {
    const { data, error } = await supabase
      .from("lost_items")
      .insert([{ item_name, description, location }]);

    if (error) throw error;

    res.json({ message: "Lost item added successfully ✅", id: data[0].id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add lost item" });
  }
});

// Add Returned Item
app.post("/return", async (req, res) => {
  const { item_name, description, location } = req.body;

  try {
    const { data, error } = await supabase
      .from("return_items")
      .insert([{ item_name, description, location }]);

    if (error) throw error;

    res.json({ message: "Returned item recorded successfully ✅", id: data[0].id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add returned item" });
  }
});

// Fetch Lost Items
app.get("/lost", async (req, res) => {
  try {
    const { data, error } = await supabase.from("lost_items").select("*");
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch lost items" });
  }
});

// Fetch Returned Items
app.get("/return", async (req, res) => {
  try {
    const { data, error } = await supabase.from("return_items").select("*");
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch returned items" });
  }
});

/* ====================
   FRONTEND ROUTES
==================== */

// Home
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

// Login
app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "public/login.html"));
});

// Register
app.get("/register", (req, res) => {
  res.sendFile(path.join(__dirname, "public/register.html"));
});

// Dashboard
app.get("/dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "public/dashboard.html"));
});

// report
app.get("/report", (req, res) => {
  res.sendFile(path.join(__dirname, "public/report.html"));
});
// search
app.get("/search", (req, res) => {
  res.sendFile(path.join(__dirname, "public/search.html"));
});
// support
app.get("/support", (req, res) => {
  res.sendFile(path.join(__dirname, "public/support.html"));
});

/* ====================
   START SERVER
==================== */

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
