const jwt = require("jsonwebtoken");
const User = require("../models/User");

const authMiddleware = async (req, res, next) => {
  try {
 /*    console.log("========== AUTH DEBUG ==========");
    console.log("Origin:", req.headers.origin);
    console.log("Cookie header:", req.headers.cookie);
    console.log("Parsed cookies:", req.cookies);
    console.log("Token:", req.cookies?.token ? "FOUND" : "NOT FOUND");
    console.log(
      "JWT_SECRET:",
      process.env.JWT_SECRET ? "FOUND" : "NOT FOUND"
    );
    console.log("NODE_ENV:", process.env.NODE_ENV);
    console.log("================================"); */

    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    console.log("Decoded:", decoded);

    const user = await User.findById(decoded.id)
      .select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Account inactive",
      });
    }

    req.user = user;

    next();
  } catch (error) {
    console.error("AUTH ERROR:", error);

    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

module.exports = authMiddleware;