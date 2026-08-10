const mongoose = require("mongoose");

const menuItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  image: {
    type: String, // e.g. "images/quarter-chicken.jpg"
    required: true,
  },
  category: {
    type: String, // e.g. "mains", "sides", "desserts"
    default: "mains",
  },
  available: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

module.exports = mongoose.model("MenuItem", menuItemSchema);