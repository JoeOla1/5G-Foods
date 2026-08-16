const express = require("express");
const axios = require("axios");
const Cart = require("../models/Cart");
const Order = require("../models/Order");
const requireAuth = require("../middleware/auth");

const router = express.Router();

// ---------- VERIFY PAYSTACK PAYMENT & CREATE ORDER ----------
router.post("/payment/verify", requireAuth, async (req, res) => {
  try {
    const { reference, deliveryDetails } = req.body;

    if (!reference || !deliveryDetails) {
      return res.status(400).json({ message: "Reference and delivery details are required." });
    }

    // Prevent double-processing the same payment
    const existingOrder = await Order.findOne({ paymentReference: reference });
    if (existingOrder) {
      return res.status(200).json({ message: "Order already recorded.", order: existingOrder });
    }

    // Verify the transaction directly with Paystack
    const verifyRes = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    const paystackData = verifyRes.data.data;

    if (paystackData.status !== "success") {
      return res.status(400).json({ message: "Payment was not successful." });
    }

    // Load the user's cart to build the order + confirm the amount
    const cart = await Cart.findOne({ user: req.userId }).populate("items.menuItem");

    if (!cart || !cart.items.length) {
      return res.status(400).json({ message: "Cart is empty." });
    }

    const validItems = cart.items.filter((item) => item.menuItem);

    const orderItems = validItems.map((item) => ({
      menuItem: item.menuItem._id,
      name: item.menuItem.name,
      price: item.menuItem.price,
      quantity: item.quantity,
    }));

    const calculatedTotal = orderItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    const amountPaid = paystackData.amount / 100; // Paystack returns amount in kobo

    // Security check: what was actually paid must match what the cart says is owed
    if (amountPaid !== calculatedTotal) {
      console.error(
        `Amount mismatch — paid ₦${amountPaid}, expected ₦${calculatedTotal}`
      );
      return res.status(400).json({ message: "Payment amount mismatch." });
    }

    // Create the order
    const order = await Order.create({
      user: req.userId,
      items: orderItems,
      totalAmount: calculatedTotal,
      deliveryDetails: deliveryDetails,
      paymentReference: reference,
      paymentStatus: "paid",
      orderStatus: "placed",
    });

    // Clear the cart now that the order is placed
    cart.items = [];
    await cart.save();

    res.status(201).json({ message: "Order placed successfully.", order });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Payment verification failed." });
  }
});

module.exports = router;
