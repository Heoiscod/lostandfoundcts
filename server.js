import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { supabase } from "./supabaseClient.js"; // your supabaseClient.js

const app = express();
app.use(cors());
app.use(express.json());

// Secret key for JWT
const JWT_SECRET = "your_secret_key_here";

// ==================== USER AUTH ====================

// ✅ Register Route
app.post("/register", async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: "All fields are required" });
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Insert user into Supabase
  const { data, error } = await supabase
    .from("users")
    .insert([{ username, email, password: hashedPassword }]);

  if (error) {
    console.error(error);
    return res.status(500).json({ error: "Registration failed" });
  }

  res.json({ message: "User registered successfully ✅" });
});

// ✅ Login Route
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ error: "Email and password required" });

  // Fetch user by email
  const { data: users, error } = await supabase
    .from("users")
    .select("*")
    .eq("email", email)
    .single();

  if (error || !users) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const isMatch = await bcrypt.compare(password, users.password);
  if (!isMatch) return res.status(401).json({ error: "Invalid credentials" });

  // Generate JWT
  const token = jwt.sign(
    { id: users.id, username: users.username, email: users.email },
    JWT_SECRET,
    { expiresIn: "1h" }
  );

  res.json({ message: "Login successful ✅", token });
});

// ==================== LOST & RETURN ITEMS ====================

// Add Lost Item
app.post("/lost", async (req, res) => {
  const { item_name, description, location } = req.body;

  const { data, error } = await supabase
    .from("lost_items")
    .insert([{ item_name, description, location }]);

  if (error) return res.status(500).json({ error });
  res.json({ message: "Lost item added successfully ✅", id: data[0].id });
});

// Add Returned Item
app.post("/return", async (req, res) => {
  const { item_name, description, location } = req.body;

  const { data, error } = await supabase
    .from("return_items")
    .insert([{ item_name, description, location }]);

  if (error) return res.status(500).json({ error });
  res.json({ message: "Returned item recorded successfully ✅", id: data[0].id });
});

// Fetch Lost Items
app.get("/lost", async (req, res) => {
  const { data, error } = await supabase.from("lost_items").select("*");
  if (error) return res.status(500).json({ error });
  res.json(data);
});

// Fetch Returned Items
app.get("/return", async (req, res) => {
  const { data, error } = await supabase.from("return_items").select("*");
  if (error) return res.status(500).json({ error });
  res.json(data);
});

// Start server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
