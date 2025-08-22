// server.js
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { createClient } = require("@supabase/supabase-js");

const app = express();
app.use(cors());
app.use(express.json());

// ================== SUPABASE CONFIG ==================
const SUPABASE_URL = "https://wayiqcnkthghfszchcly.supabase.co";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndheWlxY25rdGhnaGZzemNoY2x5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4OTU0NjMsImV4cCI6MjA3MTQ3MTQ2M30.f-_3WucFAEaVogJGkLuwon0V-rAAuRlQjcpA8jF-tcg"; // use service role key
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// JWT Secret
const JWT_SECRET = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndheWlxY25rdGhnaGZzemNoY2x5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTg5NTQ2MywiZXhwIjoyMDcxNDcxNDYzfQ.NtOmommtS3TNwcbEBRRbygIXdB1glvhgxZGM4cffIwM";

// ================== TEST ROUTE ==================
app.get("/", (req, res) => {
  res.send("Supabase Lost & Found Backend is running ✅");
});

// ================== USER AUTH ==================

// Register (directly add user, no email verification)
app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: "All fields are required" });

  const hashedPassword = await bcrypt.hash(password, 10);

  const { data, error } = await supabase
    .from("users")
    .insert([{ username, password: hashedPassword }]);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: "User registered successfully ✅", data });
});

// Login (check username + password)
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("username", username);

  if (error) return res.status(500).json({ error: error.message });
  if (data.length === 0) return res.status(401).json({ error: "Invalid credentials" });

  const user = data[0];
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(401).json({ error: "Invalid credentials" });

  // Generate JWT Token
  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: "1h" });
  res.json({ message: "Login successful ✅", token });
});

// ================== LOST & RETURN ITEMS ==================

// Add Lost Item
app.post("/lost", async (req, res) => {
  const { item_name, description, location } = req.body;
  const { data, error } = await supabase
    .from("lost_items")
    .insert([{ item_name, description, location }]);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: "Lost item added successfully ✅", data });
});

// Add Returned Item
app.post("/return", async (req, res) => {
  const { item_name, description, location } = req.body;
  const { data, error } = await supabase
    .from("return_items")
    .insert([{ item_name, description, location }]);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: "Returned item recorded successfully ✅", data });
});

// Fetch Lost Items
app.get("/lost", async (req, res) => {
  const { data, error } = await supabase.from("lost_items").select("*");
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Fetch Returned Items
app.get("/return", async (req, res) => {
  const { data, error } = await supabase.from("return_items").select("*");
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// ================== START SERVER ==================
const PORT = 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
