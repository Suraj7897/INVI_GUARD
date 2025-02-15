const mongoose=require("mongoose");
const bcrypt=require("bcrypt");
const jwt = require("jsonwebtoken");

const userSchema=new mongoose.Schema({
    username:{
        type:String,
        require:true,
    },
    email:{
        type:String,
        require:true,
    }, 
    phone:{
        type:String,
        require:true,
    },
    password:{
        type:String,
        require:true,
    },
    isAdmin:{
        type:Boolean,
        default:false,
    },

});

userSchema.pre('save',async function(){
  const user=this;
  console.log("actual data ", this);

  
  if(!user.isModified("password")){
    next();
  }
  try {
     // hash password//
     const saltRound=await bcrypt.genSalt(10);
     const hash_password=await bcrypt.hash(user.password,saltRound);
     user.password= hash_password;
    
  } catch (error) {
    next(error)
  }
});
// generate webtoken//

userSchema.methods.generateToken = async function () {
  console.log("I am token");
  try {
    return jwt.sign(
      {
        userId: this._id.toString(),
        email: this.email,
        isAdmin: this.isAdmin,
      },
      process.env.JWT_SECRET_KEY,
      {
        expiresIn: "30d",
      }
    );
  } catch (error) {
    console.error("Token Error: ", error);
  }
};

// comparePassword
userSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

const User=new mongoose.model("User",userSchema);

module.exports= User;