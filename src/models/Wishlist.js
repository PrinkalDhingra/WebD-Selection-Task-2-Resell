const mongoose = require("mongoose"); // Erase if already required

// Declare the Schema of the Mongo model
var wishlistSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    productId: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    }],
  },
  {
    timestamps: true,
  }
);

//Export the model
module.exports = mongoose.model("Wishlist", wishlistSchema);