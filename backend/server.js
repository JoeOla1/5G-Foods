const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const menuRoutes = require("./routes/menuRoutes");
const cartRoutes = require("./routes/cartRoutes");
const paymentRoutes = require("./routes/paymentRoutes");

const app = express();

app.use(cors());
app.use(express.json());

console.log("MongoDB URI:", process.env.MONGODB_URI);

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

const PORT = process.env.PORT || 5000;

app.get("/", (req, res) => {
  res.send("THIS IS THE CORRECT SERVER");
});

app.get("/message", (req, res) => {
  res.send("Hello from the backend!");
});

// ---------- MOUNT ROUTES ----------
app.use(authRoutes);
app.use(menuRoutes);
app.use(cartRoutes);
app.use(paymentRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
