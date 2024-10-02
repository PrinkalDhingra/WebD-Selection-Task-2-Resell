const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  originalprice: {
    type: Number,
    required: true,
  },
  discountPrice: {
    type: Number,
    required: [true, "Please enter your product price!"],
  },
  stockQuantity:{
    type:Number,
    required:true
},
images: [
    {
      public_id: {
        type: String,
        required: true,
      },
    },
  ],
 reviews: [
    {
      user: {
        type: Object,
      },
      rating: {
        type: Number,
      },
      comment: {
        type: String,
      },
      productId: {
        type: String,
      },
      createdAt:{
        type: Date,
        default: Date.now(),
      }
    },
  ],
  ratings: {
    type: Number,
  },
    category:{
        type:String,
        required:true
    },
  sellerId: {
    type:mongoose.Schema.Types.ObjectId,
    required:true
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Product', ProductSchema);
