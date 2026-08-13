const User = require("../models/User");

const asyncHandler = require("../helpers/asyncHandler");
const ApiResponse = require("../helpers/ApiResponse");

const { hashPassword, comparePassword } = require("../services/authService");

const generateToken = require("../utils/generateToken");

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

      "Registration successful",
    ),
  );
});
// CREATE SUPER ADMIN (ONLY FIRST TIME)

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

      "Super Admin created successfully",
    ),
  );
});

// LOGIN COMMON USER

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

  const isMatch = await comparePassword(password, user.password);

  if (!isMatch) {
    return res.status(401).json({
      success: false,

      message: "Invalid email or password",
    });
  }

  const token = generateToken(user);

  user.lastLogin = new Date();

  await user.save();

  res.cookie("token", token, {
    httpOnly: true,

    secure: false,

    sameSite: "lax",

    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.json(
    new ApiResponse(
      200,

      {
        id: user._id,

        name: user.name,

        email: user.email,

        role: user.role,
      },

      "Login successful",
    ),
  );
});

// LOGOUT

exports.logoutUser = asyncHandler(async (req, res) => {
  res.clearCookie("token");

  res.json({
    success: true,

    message: "Logout successful",
  });
});
