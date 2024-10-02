const Wishlist = require("../models/Wishlist");
const mongoose = require('mongoose');


//add item to wishlist
exports.addToWishlist = async (req, res) => {
    const { productId } = req.body;
    const userId = req.user.id;
  
    try {
      if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(400).json({ message: "Invalid product ID" });
      }
  
      let wishlist = await Wishlist.findOne({ userId });
  
      if (wishlist) {
        if (wishlist.productIds.includes(productId)) {
          return res.status(400).json({ message: "Product already in wishlist" });
        }
        wishlist.productId.push(productId);
      } else {
        wishlist = new Wishlist({
          userId,
          productId: [productId],
        });
      }
  
      console.log(wishlist);
      await wishlist.save();
  
      res.status(200).json({ message: "Product added to wishlist", wishlist });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Error adding to wishlist", error });
    }
  };
  


  // Remove item from wishlist
exports.removeFromWishlist = async (req, res) => {
    const { productId } = req.body;
    const userId = req.user.id;
  
    try {
      if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(400).json({ message: "Invalid product ID" });
      }
  
      let wishlist = await Wishlist.findOne({ userId });
  
      if (!wishlist) {
        return res.status(404).json({ message: "Wishlist not found" });
      }
  
      const index = wishlist.productId.indexOf(productId);
      if (index === -1) {
        return res.status(400).json({ message: "Product not found in wishlist" });
      }
  
      wishlist.productId.splice(index, 1); // Remove the product from the wishlist
  
      await wishlist.save();
  
      res.status(200).json({ message: "Product removed from wishlist", wishlist });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Error removing from wishlist", error });
    }
  };