const mongoose = require("mongoose");
const { Schema } = mongoose;

const orderSchema = new Schema(
  {
    cart: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product", // Reference to the Product model
          required: true, // Ensure productId is required
        },
        quantity: {
          type: Number,
          required: true,
          default: 1, // Default quantity if not specified
        },
      },
    ],
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Assuming you have a User model
      required: true,
    },
    
    shippingAddress: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['Processing', 'Dispatched', 'Out for delivery', 'Delivered'],
      default: 'Processing',
    },
    totalPrice: {
      type: Number,
      required: true,
    },
    paymentMethod: {
      type: String,
    },
    paymentInfo: {
      id: {
        type: String,
      },
      status: {
        type: String,
      },
    },
    deliveredAt: {
      type: Date,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { versionKey: false }
);

module.exports = mongoose.model("Order", orderSchema);