// models/Coupon.js
const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
  },
  discountType: { // 'percentage' or 'amount'
    type: String,
    required: true,
    enum: ['percentage', 'amount'],
  },
  discountValue: {
    type: Number,
    required: true,
  },
  expiryDate: {
    type: Date,
    required: true,
  },
  applicableProducts: [{ // Products that the coupon can be applied to
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  }],
  sellerId: { // Seller who created the coupon
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User', // Assuming User model represents sellers
  },
});

module.exports = mongoose.model('Coupon', couponSchema);
