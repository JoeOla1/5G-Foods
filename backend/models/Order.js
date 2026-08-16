const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  menuItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuItem',
  },
  name: { type: String, required: true },     // snapshot — in case menu item is edited/deleted later
  price: { type: Number, required: true },    // snapshot of price at time of order
  quantity: { type: Number, required: true },
});

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    items: [orderItemSchema],
    totalAmount: {
      type: Number,
      required: true,
    },
    deliveryDetails: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      email: { type: String, required: true },
      address: { type: String, required: true },
      notes: { type: String, default: '' },
    },
    paymentReference: {
      type: String,
      required: true,
      unique: true, // prevents the same Paystack reference from being processed twice
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed'],
      default: 'pending',
    },
    orderStatus: {
      type: String,
      enum: ['placed', 'preparing', 'out-for-delivery', 'delivered', 'cancelled'],
      default: 'placed',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
