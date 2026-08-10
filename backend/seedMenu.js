const mongoose = require("mongoose");
const MenuItem = require("./models/MenuItem");
require("dotenv").config();

const menuItems = [
  {
    name: "Quarter Chicken",
    description: "Flame-grilled quarter chicken, perfectly seasoned and served hot with fresh salad.",
    price: 4500,
    image: "images/quarter-chicken.jpg",
    category: "mains",
  },
  {
    name: "Special Jollof Rice",
    description: "Smoky Nigerian jollof rice cooked with rich spices and bursting with authentic flavor.",
    price: 3500,
    image: "images/login-bg.jpg",
    category: "mains",
  },
  {
    name: "White Rice",
    description: "Steamed long-grain white rice served fresh, perfect with your favorite sauce or stew.",
    price: 3000,
    image: "images/white-rice.jpg",
    category: "mains",
  },
  {
    name: "Peppered Snail",
    description: "Tender, spicy snail sautéed with peppers, onions, and signature house seasoning.",
    price: 6000,
    image: "images/snail.jpg",
    category: "mains",
  },
  {
    name: "Vanilla Ice Cream",
    description: "Smooth, creamy vanilla ice cream topped with a sweet cherry for the perfect finish.",
    price: 1100,
    image: "images/icecream.jpg",
    category: "desserts",
  },
  {
    name: "Puff Puff",
    description: "Soft, fluffy Nigerian puff puff, fried to golden perfection and lightly sweetened.",
    price: 800,
    image: "images/puff-puff.jpg",
    category: "sides",
  },
];

mongoose
  .connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log("✅ MongoDB Connected — seeding menu...");
    await MenuItem.deleteMany({}); // clears existing menu items before reseeding
    await MenuItem.insertMany(menuItems);
    console.log(`✅ Seeded ${menuItems.length} menu items.`);
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  });