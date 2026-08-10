const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const User = require("./models/User");
const MenuItem = require("./models/MenuItem");
const Cart = require("./models/Cart");
const requireAuth = require("./middleware/auth");
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

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
const googleClient = new OAuth2Client("963467298379-vfm1r14822rm8gg9sl3b51lf0knn5dil.apps.googleusercontent.com");

// ---------- JWT HELPER ----------
function generateToken(user) {
  return jwt.sign(
    {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

app.get("/", (req, res) => {
  res.send("THIS IS THE CORRECT SERVER");
});

app.get("/message", (req, res) => {
  res.send("Hello from the backend!");
});

// ---------- GET MENU ----------
app.get("/menu", async (req, res) => {
  try {
    const items = await MenuItem.find({ available: true });
    res.status(200).json({ items });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// ---------- GET CART ----------
app.get("/cart", requireAuth, async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.userId }).populate("items.menuItem");

    if (!cart) {
      cart = await Cart.create({ user: req.userId, items: [] });
    }

    res.status(200).json({ cart });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// ---------- ADD ITEM TO CART ----------
app.post("/cart/add", requireAuth, async (req, res) => {
  try {
    const { menuItemId, quantity } = req.body;

    if (!menuItemId) {
      return res.status(400).json({ message: "menuItemId is required." });
    }

    let cart = await Cart.findOne({ user: req.userId });

    if (!cart) {
      cart = await Cart.create({ user: req.userId, items: [] });
    }

    const existingItem = cart.items.find(
      (item) => item.menuItem.toString() === menuItemId
    );

    if (existingItem) {
      existingItem.quantity += quantity || 1;
    } else {
      cart.items.push({ menuItem: menuItemId, quantity: quantity || 1 });
    }

    await cart.save();
    await cart.populate("items.menuItem");

    res.status(200).json({ message: "Item added to cart.", cart });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// ---------- UPDATE ITEM QUANTITY ----------
app.put("/cart/update", requireAuth, async (req, res) => {
  try {
    const { menuItemId, quantity } = req.body;

    if (!menuItemId || quantity == null) {
      return res.status(400).json({ message: "menuItemId and quantity are required." });
    }

    const cart = await Cart.findOne({ user: req.userId });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found." });
    }

    const item = cart.items.find(
      (item) => item.menuItem.toString() === menuItemId
    );

    if (!item) {
      return res.status(404).json({ message: "Item not in cart." });
    }

    if (quantity <= 0) {
      cart.items = cart.items.filter(
        (item) => item.menuItem.toString() !== menuItemId
      );
    } else {
      item.quantity = quantity;
    }

    await cart.save();
    await cart.populate("items.menuItem");

    res.status(200).json({ message: "Cart updated.", cart });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// ---------- REMOVE ITEM FROM CART ----------
app.delete("/cart/remove/:menuItemId", requireAuth, async (req, res) => {
  try {
    const { menuItemId } = req.params;

    const cart = await Cart.findOne({ user: req.userId });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found." });
    }

    cart.items = cart.items.filter(
      (item) => item.menuItem.toString() !== menuItemId
    );

    await cart.save();
    await cart.populate("items.menuItem");

    res.status(200).json({ message: "Item removed.", cart });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// ---------- SIGNUP ----------
app.post("/signup", async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({
        message: "Please fill in all fields.",
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        message: "Email already exists.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      fullName,
      email,
      password: hashedPassword,
    });

    await newUser.save();

    const token = generateToken(newUser);

    res.status(201).json({
      message: "Account created successfully!",
      token: token,
      user: {
        fullName: newUser.fullName,
        email: newUser.email,
      },
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
});

// ---------- LOGIN ----------
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Please fill in all fields.",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        message: "Invalid email or password.",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid email or password.",
      });
    }

    const token = generateToken(user);

    res.status(200).json({
      message: "Login successful!",
      token: token,
      user: {
        fullName: user.fullName,
        email: user.email,
      },
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
});

// ---------- GOOGLE AUTH ----------
app.post("/google-auth", async (req, res) => {
  try {
    const { token } = req.body;

    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: "963467298379-vfm1r14822rm8gg9sl3b51lf0knn5dil.apps.googleusercontent.com",
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name } = payload;

    let user = await User.findOne({ email });

    if (!user) {
      user = new User({
        fullName: name,
        email: email,
        googleId: googleId,
      });
      await user.save();
    } else if (!user.googleId) {
      user.googleId = googleId;
      await user.save();
    }

    const jwtToken = generateToken(user);

    res.status(200).json({
      message: "Google sign-in successful!",
      token: jwtToken,
      user: {
        fullName: user.fullName,
        email: user.email,
      },
    });

  } catch (error) {
    console.error(error);
    res.status(401).json({
      message: "Google authentication failed.",
    });
  }
});

// ---------- ME (check if token is still valid) ----------
app.get("/me", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided." });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    res.status(200).json({
      user: {
        fullName: decoded.fullName,
        email: decoded.email,
      },
    });

  } catch (error) {
    res.status(401).json({ message: "Invalid or expired token." });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
