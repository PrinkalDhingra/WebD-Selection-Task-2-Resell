const express = require("express")
const router = express.Router()

const{
    addProduct,deleteProduct,addReview,showAllProducts,getProductsByPriceRange,getProductsByName,
    getProductsByCategory,editProduct
}=require("../controllers/Product")


const{
    createOrder,getAllOrdersByUserId,updateOrderStatus
}=require("../controllers/Order");


const{
    updateCartQuantity,
    addToCart, 
    deleteFromCart
}=require("../controllers/Cart")

const{
    createCoupon
}=require("../controllers/Coupon")

const{
    addToWishlist,removeFromWishlist 
}=require("../controllers/Wishlist")



// Importing Middlewares
const { auth, isBuyer, isSeller, isAdmin } = require("../middlewares/auth")



//Product routes
router.post("/addproduct", auth, isSeller, addProduct);
router.post("/addreview",auth,isBuyer,addReview);
router.delete("/deleteproduct/:productId",auth,isSeller,deleteProduct);
router.get("/showallproducts",auth,showAllProducts);



//Order routes
router.post("/createorder",auth,isBuyer,createOrder);
router.get("/getallordersbyuserid",auth,isBuyer,getAllOrdersByUserId);
router.put("/updateorderstatus/:id",auth,isAdmin,updateOrderStatus);
router.put("/updateproduct/:productId",auth,isSeller,editProduct)


//Add to cart
router.post("/addtocart",auth,isBuyer,addToCart);
router.put("/updatequantity",auth,isBuyer,updateCartQuantity);
router.delete("/removeitemfromcart",auth,isBuyer,deleteFromCart)


//Add to wishlist
router.post("/addtowishlist",auth,isBuyer,addToWishlist);
router.delete("/removefromwishlist",auth,isBuyer,removeFromWishlist);


//filter system
router.get("/filterproductwithprice",auth,isBuyer,getProductsByPriceRange);
router.get("/filterproductwithname",auth,isBuyer,getProductsByName);
router.get("/filterproductwithcategory",auth,isBuyer,getProductsByCategory);


//coupon system
router.post("/createcoupon",auth,isSeller,createCoupon);


module.exports = router
