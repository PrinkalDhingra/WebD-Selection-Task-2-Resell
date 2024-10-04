
const Coupon = require('../models/Coupon');
const Product = require('../models/Product');

exports.createCoupon = async (req, res) => {
  try {
    const { code, discountType, discountValue, expiryDate, productIds } = req.body;
    const sellerId = req.user.id; 

    const products = await Product.find({ _id: { $in: productIds }, sellerId });

    if (products.length !== productIds.length) {
      return res.status(400).json({ message: 'Some products do not belong to this seller' });
    }

    const newCoupon = await Coupon.create({
      code,
      discountType,
      discountValue,
      expiryDate,
      applicableProducts: productIds,
      sellerId,
    });

    res.status(201).json({ success: true, coupon: newCoupon });
  } catch (error) {
    console.error('Coupon creation failed!', error);
    res.status(500).json({ message: 'Error creating coupon, please try again.' });
  }
};


exports.validateCoupon = async (req, res) => {
  const { code, productId } = req.body;

  try {
    const coupon = await Coupon.findOne({ code });

    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found' });
    }

    // Check expiry date
    if (new Date() > coupon.expiryDate) {
      return res.status(400).json({ message: 'Coupon has expired' });
    }

  
    if (!coupon.applicableProducts.includes(productId)) {
      return res.status(400).json({ message: 'Coupon not applicable for this product' });
    }

    res.status(200).json({ success: true, coupon });
  } catch (error) {
    console.error('Coupon validation failed!', error);
    res.status(500).json({ message: 'Error validating coupon, please try again.' });
  }
};
