const User =require("../models/user-model")
const bcrypt=require("bcrypt")

const home=async(req,res)=>{
    try {
        res.status(200).send("welcome to invigaurd");
  
    } catch (error) {
        console.log(error);
           
    }
    

} ;

// registration logic//
const register=async(req,res)=>{
    try {
        console.log(req.body);
        const {username,email,phone,password}=req.body;

        const userExist =await User.findOne({email});

        if(userExist){
            return res.status(400).json({msg:"email already exists"}); 
        };
       

        const userCreated = await User.create({ username, email, phone, password });
        
        res.status(201).json({
            msg: "Registration Successful",
            token: await userCreated.generateToken(),
            userId: userCreated._id.toString(),
          });
    } catch (error) {
        console.log(error);
           
    }
    

} ;

const login = async (req, res) => {
    try {
      const { email, password } = req.body;
  
      const userExist = await User.findOne({ email });
  
      if (!userExist) {
        return res.status(400).json({ message: "Invalid credentials" });
      }
  
      // const user = await bcrypt.compare(password, userExist.password);
      const isPasswordValid = await userExist.comparePassword(password);
  
      if (isPasswordValid) {
        res.status(200).json({
          message: "Login Successful",
          token: await userExist.generateToken(),
          userId: userExist._id.toString(),
        });
      } else {
        res.status(401).json({ message: "Invalid email or passord " });
      }
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  };

  const user = async (req, res) => {
    try {
      // const userData = await User.find({});
      const userData = req.user;
      console.log(userData);
      return res.status(200).json({ msg: userData });
    } catch (error) {
      console.log(` error from user route ${error}`);
    }
  };

module.exports={home,register,login ,user};