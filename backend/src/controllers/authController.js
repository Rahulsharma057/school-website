const User = require("../models/User");

const asyncHandler = require("../helpers/asyncHandler");
const ApiResponse = require("../helpers/ApiResponse");

const {
  hashPassword,
  comparePassword,
} = require("../services/authService");

const generateToken = require("../utils/generateToken");

// =========================================================
// REGISTER USER
// =========================================================

exports.registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;

  const existingUser = await User.findOne({
    email,
  });

  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: "Email already registered",
    });
  }

  const hashedPassword = await hashPassword(password);

  const user = await User.create({
    name,
    email,
    phone: phone || null,
    password: hashedPassword,
    role: "STUDENT",
  });

  res.status(201).json(
    new ApiResponse(
      201,
      {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      "Registration successful"
    )
  );
});

// =========================================================
// CREATE SUPER ADMIN
// =========================================================

exports.createSuperAdmin = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const existingUser = await User.findOne({
    email,
  });

  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: "User already exists",
    });
  }

  const hashedPassword = await hashPassword(password);

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    role: "SUPER_ADMIN",
  });

  res.status(201).json(
    new ApiResponse(
      201,
      {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      "Super Admin created successfully"
    )
  );
});

// =========================================================
// LOGIN COMMON USER
// =========================================================

exports.loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({
    email,
  });

  if (!user) {
    return res.status(401).json({
      success: false,
      message: "Invalid email or password",
    });
  }

  if (!user.isActive) {
    return res.status(403).json({
      success: false,
      message: "Account inactive",
    });
  }

  const isMatch = await comparePassword(
    password,
    user.password
  );

  if (!isMatch) {
    return res.status(401).json({
      success: false,
      message: "Invalid email or password",
    });
  }

  // Generate JWT
  const token = generateToken(user);

  // Update last login
  user.lastLogin = new Date();

  await user.save();

  // =======================================================
  // COOKIE
  // Local:
  //   secure: false
  //   sameSite: "lax"
  //
  // Production:
  //   secure: true
  //   sameSite: "none"
  //
  // Required because frontend is on Vercel and backend
  // is on a different domain.
  // =======================================================

  const isProduction = process.env.NODE_ENV === "production";

  res.cookie("token", token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  // =======================================================
  // RESPONSE
  // =======================================================

  res.json(
    new ApiResponse(
      200,
      {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      "Login successful"
    )
  );
});

// =========================================================
// LOGOUT
// =========================================================

exports.logoutUser = asyncHandler(async (req, res) => {
  const isProduction = process.env.NODE_ENV === "production";

  res.clearCookie("token", {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
  });

  res.json({
    success: true,
    message: "Logout successful",
  });
});