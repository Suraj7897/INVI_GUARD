const mongoose=require("mongoose");

const URI=process.env.MOONGODB_URI;

const connectDb=async()=>{
    try {

        await mongoose.connect(URI);
        console.log("connection sucessful");
        
    } catch (error) {
        console.log("database connection failed");
        process.exit(0);
        
    }
}

module.exports=connectDb;