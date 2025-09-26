const jwt = require("jsonwebtoken");
const User = require("../models/User");

const userAuth = async (req, res, next) => {
  try {
    // First try to get token from cookies
    let token = req.cookies.token;
    
    // If not in cookies, try Authorization header
    if (!token && req.headers.authorization) {
      token = req.headers.authorization.replace('Bearer ', '');
    }


    if (!token) {
      return res.status(401).json({ message: "Please login properly" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth Middleware Error:', error.message);
    res.status(401).json({ message: "Authentication failed", error: error.message });
  }
};

module.exports = { userAuth };