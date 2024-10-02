const mongoose =  require('mongoose');


const userSchema = new mongoose.Schema({
    firstName:{
        type:String, 
        required:true,
        trim:true
    },
    lastName:{
        type:String, 
        required:true,
        trim:true
    },
    email:{
        type:String, 
        required:true,
        trim:true
    },
    contactNumber: {
        type: String,
        required: true,
      },
    password:{
        type:String, 
        required:true,
        trim:true
    },
    accountType:{
        type:String, 
        enum:["Buyer","Admin","Seller"],
        required:true,
    },
    additionalDetails:{
        type:mongoose.Schema.Types.ObjectId, 
        ref:"Profile",
        required:true, //watch for this required or not
    },
    products:[{
        type:mongoose.Schema.Types.ObjectId, 
        ref:"Product",
        default: [] 
    }],
    token:{
        type: String
    },
    resetPasswordExpires:{
        type: Date
    },
    image:{
        type:String,
        required:true
    },
    active: {
        type: Boolean,
        default: true,
    },
})

module.exports = mongoose.model("User", userSchema);