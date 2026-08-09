const jwt = require("jsonwebtoken");

const User = require("../models/User");

// Optional auth — attaches req.user if a valid token is present,
// otherwise silently continues as an anonymous request. Never throws,
// since this guards public routes that may or may not be restricted
// (that decision happens later, dynamically, per-form via checkFormAccess).
const softAuth = async (req, res, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.headers?.authorization?.replace("Bearer ", "");

    if (!token) return next();

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const user = await User.findById(decoded._id).select("_id role").lean();

    if (user) {
      req.user = user;
    }

    next();
  } catch {
    // Invalid/expired token on a public route — just proceed anonymously.
    next();
  }
};

module.exports = softAuth;