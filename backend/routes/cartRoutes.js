const express = require("express");
const Cart = require("../models/Cart");
const requireAuth = require("../middleware/auth");

const router = express.Router();

// ---------- GET CART ----------
router.get("/cart", requireAuth, async (req, res) => {
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
router.post("/cart/add", requireAuth, async (req, res) => {
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
router.put("/cart/update", requireAuth, async (req, res) => {
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
router.delete("/cart/remove/:menuItemId", requireAuth, async (req, res) => {
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

module.exports = router;
