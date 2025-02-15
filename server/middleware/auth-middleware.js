const jwt = require("jsonwebtoken");
const User = require("../models/user-model");

const authMiddleware = async (req, res, next) => {
  const token = req.header("Authorization");

  if (!token || !token.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized. Token not provided or malformed." });
  }

  const jwtToken = token.replace("Bearer ", "").trim();
  console.log("JWT Token:", jwtToken);

  try {
    const isVerified = jwt.verify(jwtToken, process.env.JWT_SECRET_KEY);
    console.log("Verified Payload:", isVerified);

    const userData = await User.findOne({ email: isVerified.email }).select({ password: 0 });

    if (!userData) {
      return res.status(404).json({ message: "User not found." });
    }

    req.token = token;
    req.user = userData;
    req.userID = userData._id;

    next();
  } catch (error) {
    let message = "Unauthorized. Invalid token.";
    if (error.name === "TokenExpiredError") {
      message = "Unauthorized. Token has expired.";
    } else if (error.name === "JsonWebTokenError") {
      message = "Unauthorized. Token is malformed.";
    }
    console.error("Token verification error:", error);
    return res.status(401).json({ message });
  }
};

module.exports = authMiddleware;
