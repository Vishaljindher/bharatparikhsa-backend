const jwt = require("jsonwebtoken");
const User = require("../models/User.js");

// ✅ Protect Middleware
const protect = async (req, res, next) => {
  let token;

  try {
    // 1️⃣ Token from headers
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }

    // 2️⃣ Token from query (optional, e.g., for GET requests)
    if (!token && req.query.token) {
      token = req.query.token;
    }

    // 3️⃣ Token from body (optional, e.g., form submissions)
    if (!token && req.body.token) {
      token = req.body.token;
    }

    // ❌ No token found
    if (!token) {
      return res.status(401).json({ message: "No token, authorization denied" });
    }

    // ✅ Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ Fetch user (exclude password)
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({ message: "User not found, authorization denied" });
    }

    // ✅ Attach user to request
    req.user = user;
    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error.message);
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired, please login again" });
    }
    res.status(401).json({ message: "Not authorized, token invalid or missing" });
  }
};

module.exports = { protect };
