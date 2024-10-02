const Order = require('../models/Order');
const Product = require("../models/Product");
const User=require("../models/User");
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Cart=require("../models/Cart")
const Coupon=require("../models/Coupon")
const mailSender = require("../utils/mailSender");


exports.createOrder = async (req, res) => {
  try {
    const { cartId, shippingAddress, paymentmethod, paymentDetails, couponCode } = req.body;
    const userId = req.user.id;

    // Validate payment method
    if (paymentmethod === 'card') {
      if (!paymentDetails || !paymentDetails.id) {
        return res.status(400).json({ message: 'Payment method ID is missing' });
      }
      console.log("Payment method ID:", paymentDetails.id); // Log for debugging
    }

    // Fetch the cart from the database
    const cart = await Cart.findById(cartId).populate('items.productId'); // Populate the product details

    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    // Calculate total price based on items in the cart
    let totalPrice = 0; // Initialize total price

    for (const item of cart.items) {
      const product = item.productId; // Each product is populated with details
      const quantity = item.quantity; // Get the specific quantity for this product

      // Calculate total price based on the discount price of the product
      totalPrice += (product.discountPrice * quantity); // Calculate total for each product
    }

    // Initialize discount
    let discount = 0;

    // Validate coupon code if provided
    if (couponCode) {
      console.log(`Validating coupon code: ${couponCode}`);
      const couponValidation = await Coupon.findOne({ code: couponCode });

      if (couponValidation) {
        console.log('Coupon found:', couponValidation);
        
        // Check if the coupon is still valid
        if (new Date() <= couponValidation.expiryDate) {
          console.log('Coupon is valid and has not expired');
          let applicable = false; // To check if any product is applicable for discount

          // Check if the coupon is applicable to any of the products in the cart
          for (const item of cart.items) {
            if (couponValidation.applicableProducts.includes(item.productId._id)) {
              applicable = true; // Set applicable to true if there's a match
              console.log(`Coupon is applicable to product: ${item.productId._id}`);
              
              // Apply discount based on coupon type
              if (couponValidation.discountType === 'percentage') {
                const itemDiscount = (item.productId.discountPrice * couponValidation.discountValue) / 100 * item.quantity; // Multiply by quantity
                discount += itemDiscount;
                console.log(`Applying percentage discount: ${itemDiscount} for quantity: ${item.quantity}`);
              } else if (couponValidation.discountType === 'amount') {
                const itemDiscount = couponValidation.discountValue * item.quantity; // Multiply by quantity
                discount += itemDiscount;
                console.log(`Applying fixed amount discount: ${itemDiscount} for quantity: ${item.quantity}`);
              }
            }
          }

          if (!applicable) {
            console.log('Coupon not applicable to any products in the cart');
          }
        } else {
          console.log('Coupon has expired');
        }
      } else {
        console.log('Coupon not found');
      }
    }

    // Subtract the total discount from the total price
    totalPrice = Math.max(totalPrice - discount, 0); // Ensure totalPrice does not go below 0
    console.log(`Total Price after applying discount: ${totalPrice}`);

    let paymentInfo = {};

    // Handle payment processing
    if (paymentmethod === 'card') {
      // Stripe payment processing using paymentDetails.id from the frontend
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(totalPrice * 100), // Amount in cents
        currency: 'usd',
        payment_method: paymentDetails.id, // Payment method ID from frontend
        confirm: true, // Confirm the payment immediately
        return_url: 'https://yourdomain.com/payment-success',
      });

      paymentInfo = {
        id: paymentIntent.id,
        status: paymentIntent.status,
      };

    } else if (paymentmethod === 'cod') {
      // Cash on delivery handling
      paymentInfo = {
        id: 'COD',
        status: 'Pending',
      };
    } else {
      return res.status(400).json({ message: 'Invalid payment method' });
    }

    // Prepare the cart data for the order
    const orderItems = cart.items.map(item => ({
      productId: item.productId._id, // Extracting productId
      quantity: item.quantity, // Using the quantity from the cart
    }));

    // Create the order
    const order = await Order.create({
      cart: orderItems, // Use the structured cart data
      shippingAddress,
      user: userId, // Direct reference to user ID
      totalPrice,
      paymentMethod: paymentmethod,
      paymentInfo,
      status: 'Processing', // Default order status
      createdAt: Date.now(), // Automatically set the createdAt field
    });


     // Send a confirmation email to the user
     const user = await User.findById(userId); // Fetch the user details for the email
     await mailSender(
       user.email, // Send email to user's email
       "Order Placed Successfully",
       `<p>Dear ${user.firstName},</p>
       <p>Your order with a total of <strong>${totalPrice}</strong> has been placed successfully. Thank you for shopping with us!</p>
       <p>Order ID: ${order._id}</p>
       <p>We will notify you when the order is dispatched.</p>`
     );
     

    // Update the user's purchased products
    const productIds = order.cart.map(item => item.productId); // Extracting product IDs from order items
    await User.findByIdAndUpdate(userId, {
      $addToSet: {
        products: { $each: productIds }, // Ensure 'products' matches your User schema
      },
    });

    res.status(201).json({
      success: true,
      order,
    });

  } catch (error) {
    console.error('Order failed!', error);
    // Check for specific error types and respond accordingly
    if (error.type === 'StripeInvalidRequestError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error, please try again later.' });
  }
};


 exports.getAllOrdersByUserId = async (req, res) => {
    const userId = req.params.userId; 

    try {
        // Find all orders associated with the user ID
        const orders = await Order.find({ user: userId })
        
        if (!orders.length) {
            return res.status(404).json({ message: 'No orders found for this user.' });
        }

        res.status(200).json(orders);
    } catch (error) {
        console.error('Error retrieving orders:', error);
        res.status(500).json({ message: 'Server error, please try again later.' });
    }
};


exports.updateOrderStatus = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('cart.productId').populate('user'); // Populate productId to access product details
    console.log(order.user); // Check if user is populated
    if (!order) {
      throw new Error("Order not found with this id");
    }

    // Handle automatic status transitions
    let previousStatus = order.status;
    switch (order.status) {
      case "Processing":
        order.status = "Dispatched";
        // Update product stock when the order is dispatched
        for (const item of order.cart) {
          await updateProductStock(item.productId._id, item.quantity);
        }
        break;
      case "Dispatched":
        order.status = "Out for delivery";
        break;
      case "Out for delivery":
        order.status = "Delivered";
        order.deliveredAt = Date.now();
        order.paymentInfo.status = "Succeeded";
        break;
      case "Delivered":
        throw new Error("Order is already delivered.");
      default:
        throw new Error("Invalid order status.");
    }

    await order.save({ validateBeforeSave: false });

    // Send an email notifying the user about the status change
    await mailSender(
      order.user.email, // Assuming the user object has an email field
      "Order Status Update",
      `<p>Your order status has been updated from <strong>${previousStatus}</strong> to <strong>${order.status}</strong>.</p>`
    );

    res.status(200).json({
      success: true,
      order,
    });

    async function updateProductStock(id, qty) {
      const product = await Product.findById(id);

      if (!product) {
        throw new Error("Product not found");
      }

      product.stockQuantity -= qty;

      if (product.stockQuantity < 0) {
        throw new Error("Insufficient stock quantity");
      }

      await product.save({ validateBeforeSave: false });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update order status',
      error: error.message,
    });
  }
};