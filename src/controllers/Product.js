const Product = require("../models/Product");
const cloudinary = require("cloudinary");
const User=require("../models/User");
const mailSender = require("../utils/mailSender");
const Wishlist=require("../models/Wishlist")
const Order=require("../models/Order")

//add a new product
exports.addProduct = async(req,res) => {
    try {
        const sellerId =req.user.id;
        let images = [];
  
        if (typeof req.body.images === "string") {
          images.push(req.body.images);
        } else {
          images = req.body.images;
        }
      
       
      
        const{name,description,originalprice,discountPrice,stockQuantity,category} = req.body;

        if(!name || !description || !originalprice || !discountPrice || !stockQuantity || !category)
        {
            return res.status(400).json({
                success:false,
                message:'All fields are required',
            });
        }

        const product = await Product.create({
            name,
            description,
            originalprice,
            discountPrice,
            stockQuantity,
            category,
            sellerId
        });

        const updatedUser = await User.findByIdAndUpdate(
          sellerId,
          { $push: { products: product._id } },  // Add product ID to 'products' array
          { new: true, useFindAndModify: false }  // Return updated document
        );
    
        if (!updatedUser) {
          return res.status(404).json({
            success: false,
            message: 'Failed to update seller\'s product list.',
          });
        }
    
        console.log('Updated user:', updatedUser);


        res.status(201).json({
          success: true,
          product,
        });


    }
      catch (error) {
        console.error(error);
        return res.status(500).json({
            success:false,
            message:'Failed to add a new product',
            error: error.message,
        })
    }
}



// get all products 
exports.showAllProducts = async (req,res) => {
  try {
      const allProducts = await Product.find({}, {
          name:true,
          deescription:true,
          originalPrice:true,
          stockQuantity:true,
      }).exec();
     
      console.log(allProducts);
      return res.status(200).json({
          success:true,
          message:'Data for all products fetched successfully',
          data:allProducts,
      })
  } catch (error) {
      console.error(error);
      return res.status(500).json({
          success:false,
          message:'Failed to show all Products',
          error: error.message,
      })
  }
}

//delete a product
exports.deleteProduct = async(req,res) =>{
  try{
    const { productId } = req.params;
  
    // Find the Product
    const product = await Product.findById(productId)
    if (!product) {
      return res.status(404).json({ message: "Product not found" })
    }
   
    // Store the sellerId to update later
    const sellerId = product.sellerId; // Assuming sellerId is part of the product document

    // Delete the Product
    await Product.findByIdAndDelete(productId);

    // Remove the product from the seller's products array
    await User.findByIdAndUpdate(
      sellerId,
      { $pull: { products: productId } },  // Use $pull to remove the product ID
      { new: true, useFindAndModify: false } // Return updated document
    );

    return res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    })
  }
  catch(error)
  {
    console.error(error)
      return res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      })
  }
}
// review for a product
exports.addReview = async(req,res) => {
  try {
    const user=req.user.id
    const { rating, comment, productId } = req.body;

    console.log(user);

    const product = await Product.findById(productId);

    const hasPurchased = await Order.findOne({
      user: user,
      "cart.productId": productId, // Check if the product is in the user's order cart
    });

    if (!hasPurchased) {
      return res.status(400).json({
        success: false,
        message: "You can only review products you have purchased.",
      });
    }

    const review = {
      user,
      rating,
      comment,
      productId,
    };

    const isReviewed = product.reviews.find(
      (rev) => rev.user === req.user.id
    );

    if (isReviewed) {
      product.reviews.forEach((rev) => {
        if (rev.user=== req.user.id) {
          (rev.rating = rating), (rev.comment = comment), (rev.user = user);
        }
      });
    } else {
      product.reviews.push(review);
    }

    let avg = 0;

    product.reviews.forEach((rev) => {
      avg += rev.rating;
    });

    product.ratings = avg / product.reviews.length;

    await product.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: "Reviewed succesfully!",
    });
  }
  catch(error)
  {
    console.error(error)
      return res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      })
  }
}

//filter the product using price range
exports.getProductsByPriceRange = async (req, res) => {
  try {
    // Get minPrice and maxPrice from the user's request body
    const { minPrice, maxPrice } = req.body;

    // Validate that the values provided are numbers
    if (minPrice && isNaN(minPrice)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid minPrice value. It must be a number.',
      });
    }

    if (maxPrice && isNaN(maxPrice)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid maxPrice value. It must be a number.',
      });
    }

    // Build a filter object for price
    let priceFilter = {};
    if (minPrice || maxPrice) {
      priceFilter.discountPrice = {};
      if (minPrice) {
        priceFilter.discountPrice.$gte = Number(minPrice); // Price greater than or equal to minPrice
      }
      if (maxPrice) {
        priceFilter.discountPrice.$lte = Number(maxPrice); // Price less than or equal to maxPrice
      }
    }

    // Find products based on the price range
    const filteredProducts = await Product.find(priceFilter, {
      name: true,
      description: true,
      originalprice: true,
      discountPrice: true,
      stockQuantity: true,
    }).exec();

    // If no products are found, return a message
    if (filteredProducts.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No products found within the given price range',
      });
    }

    // Return the filtered products
    return res.status(200).json({
      success: true,
      message: 'Products fetched successfully',
      data: filteredProducts,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Failed to filter products by price',
      error: error.message,
    });
  }
};


//filter products using name
exports.getProductsByName = async (req, res) => {
  try {
    // Get the name from the user's request body
    const { name } = req.body;

    // Validate that the name is provided
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Product name is required.',
      });
    }

    // Use a case-insensitive regex to find products that match the name
    const nameFilter = { name: { $regex: name, $options: 'i' } }; // 'i' for case-insensitive

    // Find products based on the name filter
    const filteredProducts = await Product.find(nameFilter, {
      name: true,
      description: true,
      originalprice: true,
      discountPrice: true,
      stockQuantity: true,
    }).exec();

    // If no products are found, return a message
    if (filteredProducts.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No products found with the given name',
      });
    }

    // Return the filtered products
    return res.status(200).json({
      success: true,
      message: 'Products fetched successfully',
      data: filteredProducts,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Failed to filter products by name',
      error: error.message,
    });
  }
};


//filter product by category
// Filter products by category
exports.getProductsByCategory = async (req, res) => {
  try {
    // Get the category from the user's request body
    const { category } = req.body;

    // Validate that the category is provided
    if (!category) {
      return res.status(400).json({
        success: false,
        message: 'Category is required.',
      });
    }

    // Use a case-insensitive regex to find products that match the category
    const categoryFilter = { category: { $regex: category, $options: 'i' } }; // 'i' for case-insensitive

    // Find products based on the category filter
    const filteredProducts = await Product.find(categoryFilter, {
      name: true,
      description: true,
      originalprice: true,
      discountPrice: true,
      stockQuantity: true,
    }).exec();

    // If no products are found, return a message
    if (filteredProducts.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No products found in the given category',
      });
    }

    // Return the filtered products
    return res.status(200).json({
      success: true,
      message: 'Products fetched successfully',
      data: filteredProducts,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Failed to filter products by category',
      error: error.message,
    });
  }
};



exports.editProduct = async (req, res) => {
  try {
    const { productId } = req.params; // Get productId from request parameters
    const { name, description, originalprice, discountPrice, stockQuantity, category } = req.body;
    

    // Validate that the required fields are provided
    if (!name || !description || !originalprice || !discountPrice || !stockQuantity || !category) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required.',
      });
    }

    // Find the product by ID and update it
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.',
      });
    }

    const previousDiscountPrice =product.discountPrice;

    // Update product information
    product.name = name;
    product.description = description;
    product.originalprice = originalprice;
    product.discountPrice = discountPrice;
    product.stockQuantity = stockQuantity;
    product.category = category;


    await product.save(); // Save the updated product

    // Check if there's a price drop
    if (previousDiscountPrice > discountPrice) {
      // Get all users who have this product in their wishlist
      console.log("Looking for wishlists for productId:", productId);
      
      // Find users who have the productId in their wishlist
      const wishlistedUsers = await Wishlist.find({ productId: productId }).populate('userId');
      
      console.log("Wishlisted Users:", wishlistedUsers); // Log all wishlisted users

      if (wishlistedUsers.length > 0) {
        for (const wish of wishlistedUsers) {
          const user = wish.userId; // The populated user object
          
          console.log("Notifying User:", user); // Log user details

          // Send email notification
          try {
            const mailResponse = await mailSender(user.email,
              `Price Drop!!`,
              `The price of ${product.name} has dropped! It is now $${discountPrice}. Check it out!`);
            console.log("Email sent Successfully: ", mailResponse.response);
          } catch (emailError) {
            console.error("Error sending email:", emailError);
          }
        }
      } else {
        console.log("No users wishlisted this product.");
      }
    }

    res.status(200).json({
      success: true,
      message: 'Product updated successfully.',
      product, // Return the updated product
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update the product.',
      error: error.message,
    });
  }
};
