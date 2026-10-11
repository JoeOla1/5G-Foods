const express = require("express");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const sendEmail = require("../utils/sendEmail");

const router = express.Router();

const googleClient = new OAuth2Client(
  "963467298379-vfm1r14822rm8gg9sl3b51lf0knn5dil.apps.googleusercontent.com"
);

const RESET_LINK_MINUTES = 30;

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

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

// ---------- FORGOT PASSWORD (NEW) ----------
router.post("/forgot-password", async (req, res) => {
  // Same reply every time, so nobody can use this form to find out who has an account.
  const genericReply = {
    message: "If an account exists for that email, we've sent a password reset link.",
  };

  try {
    const email = String(req.body.email || "").trim().toLowerCase();

    if (!email) {
      return res.status(400).json({ message: "Please enter your email." });
    }

    const user = await User.findOne({ email });

    // No account: reply the same way and do nothing
    if (!user) {
      return res.status(200).json(genericReply);
    }

    // Link was requested less than a minute ago: don't send another
    if (
      user.resetPasswordExpires &&
      user.resetPasswordExpires.getTime() > Date.now() + (RESET_LINK_MINUTES - 1) * 60 * 1000
    ) {
      return res.status(200).json(genericReply);
    }

    const firstName = user.fullName ? user.fullName.split(" ")[0] : "there";

    // Google-only account (no password): tell them to use Google instead
    if (!user.password) {
      await sendEmail({
        to: user.email,
        subject: "Sign in to 5G Foods with Google",
        text:
          "Hi " + firstName + ",\n\n" +
          "Your 5G Foods account uses Google sign-in, so it has no password to reset.\n" +
          "Go to the login page and click the Google button to sign in.\n\n" +
          "If you didn't ask for this, you can ignore this email.",
        html:
          '<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#222;">' +
          '<h2 style="margin:0 0 12px;color:#CC5500;">5G Foods</h2>' +
          "<p>Hi " + escapeHtml(firstName) + ",</p>" +
          "<p>Your 5G Foods account uses <strong>Google sign-in</strong>, so it has no password to reset. " +
          "Go to the login page and click the Google button to sign in.</p>" +
          '<p style="color:#777;font-size:13px;">If you didn\'t ask for this, you can ignore this email.</p>' +
          "</div>",
      });
      return res.status(200).json(genericReply);
    }

    // Make a random token. Send the raw one by email, store only its hash.
    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = new Date(Date.now() + RESET_LINK_MINUTES * 60 * 1000);
    await user.save();

    const frontendUrl = (process.env.FRONTEND_URL || "https://5g-foods.vercel.app").replace(/\/$/, "");
    const resetLink = frontendUrl + "/reset-password.html?token=" + rawToken;

    try {
      await sendEmail({
        to: user.email,
        subject: "Reset your 5G Foods password",
        text:
          "Hi " + firstName + ",\n\n" +
          "We got a request to reset your 5G Foods password. Use this link within " +
          RESET_LINK_MINUTES + " minutes:\n\n" +
          resetLink + "\n\n" +
          "If you didn't ask for this, you can ignore this email. Your password won't change.",
        html:
          '<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#222;">' +
          '<h2 style="margin:0 0 12px;color:#CC5500;">5G Foods</h2>' +
          "<p>Hi " + escapeHtml(firstName) + ",</p>" +
          "<p>We got a request to reset your password. Click the button below to choose a new one. " +
          "This link works for " + RESET_LINK_MINUTES + " minutes.</p>" +
          '<p style="margin:24px 0;"><a href="' + resetLink + '" ' +
          'style="background:#CC5500;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:999px;font-weight:bold;display:inline-block;">' +
          "Reset password</a></p>" +
          '<p style="color:#777;font-size:13px;">If the button doesn\'t work, copy this link into your browser:<br>' +
          '<span style="word-break:break-all;">' + resetLink + "</span></p>" +
          '<p style="color:#777;font-size:13px;">If you didn\'t ask for this, you can ignore this email. Your password won\'t change.</p>' +
          "</div>",
      });
    } catch (emailError) {
      // Email failed: remove the token so it can't be used, and log why
      console.error("Reset email failed:", emailError.message);
      user.resetPasswordToken = null;
      user.resetPasswordExpires = null;
      await user.save();
    }

    return res.status(200).json(genericReply);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong. Please try again." });
  }
});

// ---------- RESET PASSWORD (NEW) ----------
router.post("/reset-password", async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ message: "Please fill in all fields." });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters." });
    }

    const hashedToken = crypto.createHash("sha256").update(String(token)).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({
        message: "This reset link is invalid or has expired. Please request a new one.",
      });
    }

    user.password = await bcrypt.hash(password, 10);

    // One use only
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    res.status(200).json({ message: "Password updated. You can now log in." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong. Please try again." });
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