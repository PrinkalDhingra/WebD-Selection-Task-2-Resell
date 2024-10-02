const Cart = require("../models/Cart");
const mongoose = require("mongoose");

// Function to add items to the cart
exports.addToCart = async (req, res) => {
  const { productId } = req.body; // ProductId from the request body
  const userId = req.user.id;

  try {
    // Validate productId
    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    // Find if the cart already exists for the user
    let cart = await Cart.findOne({ userId });

    if (cart) {
      // Check if the product is already in the cart
      const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);

      if (itemIndex !== -1) {
        // If the product already exists, increment the quantity
        cart.items[itemIndex].quantity += 1;
      } else {
        // If the product doesn't exist, add a new item to the cart
        cart.items.push({ productId, quantity: 1 });
      }
    } else {
      // If the cart doesn't exist, create a new one
      cart = new Cart({
        userId,
        items: [{ productId, quantity: 1 }],
      });
    }

    // Save the cart
    await cart.save();

    res.status(200).json({ message: "Product added to cart", cart });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error adding to cart", error });
  }
};

// Controller to update the quantity (increment or decrement)
exports.updateCartQuantity = async (req, res) => {
  const { productId, action } = req.body; // action is either "+" or "-"
  const userId = req.user.id;

  try {
    // Validate productId
    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    // Find the user's cart
    let cart = await Cart.findOne({ userId });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    // Check if the product exists in the cart
    const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);

    if (itemIndex === -1) {
      return res.status(404).json({ message: "Product not found in cart" });
    }

    // Update the quantity based on the action
    if (action === "+") {
      cart.items[itemIndex].quantity += 1; // Increment quantity by 1
    } else if (action === "-") {
      if (cart.items[itemIndex].quantity > 1) {
        cart.items[itemIndex].quantity -= 1; // Decrement quantity by 1
      } else {
        return res.status(400).json({ message: "Quantity cannot be less than 1" });
      }
    } else {
      return res.status(400).json({ message: "Invalid action. Use '+' or '-'" });
    }

    // Save the updated cart
    await cart.save();
    res.status(200).json({ message: "Cart quantity updated", cart });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error updating cart quantity", error });
  }
};

// Delete item from cart
exports.deleteFromCart = async (req, res) => {
  const { productId } = req.body;
  const userId = req.user.id;

  try {
    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    let cart = await Cart.findOne({ userId });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);

    if (itemIndex === -1) {
      return res.status(404).json({ message: "Product not found in cart" });
    }

    // Remove the item from the cart
    cart.items.splice(itemIndex, 1);

    if (cart.items.length === 0) {
      // If there are no items left, delete the cart
      await Cart.findOneAndDelete({ userId });
    } else {
      // Save the updated cart
      await cart.save();
    }

    res.status(200).json({ message: "Product removed from cart", cart });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error removing product from cart", error });
  }
};
