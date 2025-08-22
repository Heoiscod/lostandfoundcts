import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { supabase } from "./supabaseClient.js";

const app = express();
app.use(cors());
app.use(express.json());

// Secret key for JWT
const JWT_SECRET = "your_secret_key_here";

// ==================== USER AUTH ====================

// Register Route
app.post("/register", async (req, res) => {
  const { name, username, email, password } = req.body;

  if (!name || !username || !email || !password) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user into Supabase
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
    // Fetch user by email
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (error || !user) return res.status(401).json({ error: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: "Invalid credentials" });

    // Generate JWT
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

// ==================== LOST & RETURN ITEMS ====================

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

// Start server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
