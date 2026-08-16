const express = require("express");
const MenuItem = require("../models/MenuItem");

const router = express.Router();

// ---------- GET MENU ----------
router.get("/menu", async (req, res) => {
  try {
    const items = await MenuItem.find({ available: true });
    res.status(200).json({ items });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = router;
