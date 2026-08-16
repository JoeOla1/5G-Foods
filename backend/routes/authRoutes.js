const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const User = require("../models/User");
const generateToken = require("../utils/generateToken");

const router = express.Router();

const googleClient = new OAuth2Client(
  "963467298379-vfm1r14822rm8gg9sl3b51lf0knn5dil.apps.googleusercontent.com"
);

// ---------- SIGNUP ----------
router.post("/signup", async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "Please fill in all fields." });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ message: "Email already exists." });
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
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// ---------- LOGIN ----------
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Please fill in all fields." });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "Invalid email or password." });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password." });
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
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// ---------- GOOGLE AUTH ----------
router.post("/google-auth", async (req, res) => {
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
    res.status(401).json({ message: "Google authentication failed." });
  }
});

// ---------- ME (check if token is still valid) ----------
router.get("/me", async (req, res) => {
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

module.exports = router;
