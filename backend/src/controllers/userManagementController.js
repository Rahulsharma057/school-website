const User = require("../models/User");

const asyncHandler = require("../helpers/asyncHandler");

const ApiResponse = require("../helpers/ApiResponse");

// ================= GET ALL USERS =================

exports.getAllUsers = asyncHandler(async (req, res) => {
  const { search, role } = req.query;

  let query = {};

  // SEARCH

  if (search) {
    query.$or = [
      {
        name: {
          $regex: search,
          $options: "i",
        },
      },

      {
        email: {
          $regex: search,
          $options: "i",
        },
      },
    ];
  }

  // ROLE FILTER

  if (role) {
    query.role = role;
  }

  const users = await User.find(query)

    .select("-password")

    .sort({
      createdAt: -1,
    });

  res.json(
    new ApiResponse(
      200,

      users,

      "Users fetched successfully",
    ),
  );
});

// ================= CHANGE ROLE =================

exports.changeRole = asyncHandler(async (req, res) => {
  const { role } = req.body;

  const allowedRoles = [
    "ADMIN",
    "PRINCIPAL",
    "TEACHER",
    "ACCOUNTANT",
    "STUDENT",
    "PARENT",
  ];

  if (!allowedRoles.includes(role)) {
    return res.status(400).json({
      success: false,

      message: "Invalid role",
    });
  }

  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({
      success: false,

      message: "User not found",
    });
  }

  // SUPER ADMIN PROTECTION

  if (user.role === "SUPER_ADMIN") {
    return res.status(403).json({
      success: false,

      message: "Super Admin role cannot be changed",
    });
  }

  user.role = role;

  // who changed role

  user.createdBy = req.user._id;

  await user.save();

  res.json(
    new ApiResponse(
      200,

      {
        id: user._id,

        role: user.role,
      },

      "Role updated successfully",
    ),
  );
});

// ================= CHANGE STATUS =================

exports.changeStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({
      success: false,

      message: "User not found",
    });
  }

  if (user.role === "SUPER_ADMIN") {
    return res.status(403).json({
      success: false,

      message: "Super Admin cannot be deactivated",
    });
  }

  user.isActive = req.body.isActive;

  await user.save();

  res.json(
    new ApiResponse(
      200,

      user,

      "Status updated successfully",
    ),
  );
});
// ================= UPDATE USER CORE INFO (name/email/phone) =================
// Access: SUPER_ADMIN, ADMIN, PRINCIPAL
// NOTE: role User.role se change nahi hoti yahan (wo alag route — changeRole — se hoti hai)

exports.updateUserCoreInfo = asyncHandler(async (req, res) => {
  const { name, email, phone } = req.body;

  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({
      success: false,

      message: "User not found",
    });
  }

  // SUPER ADMIN PROTECTION — sirf khud SUPER_ADMIN hi kisi SUPER_ADMIN ko edit kar sake
  if (user.role === "SUPER_ADMIN" && req.user.role !== "SUPER_ADMIN") {
    return res.status(403).json({
      success: false,

      message: "Cannot modify a Super Admin account",
    });
  }

  // EMAIL — duplicate check (khud ko chhod ke)
  if (email && email !== user.email) {
    const existingEmail = await User.findOne({
      email,

      _id: {
        $ne: user._id,
      },
    });

    if (existingEmail) {
      return res.status(400).json({
        success: false,

        message: "This email is already in use",
      });
    }

    user.email = email;
  }

  if (name) {
    user.name = name;
  }

  if (phone !== undefined) {
    user.phone = phone;
  }

  await user.save();

  res.json(
    new ApiResponse(
      200,

      {
        id: user._id,

        name: user.name,

        email: user.email,

        phone: user.phone,
      },

      "User info updated successfully",
    ),
  );
});
// ================= DELETE USER =================

exports.deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({
      success: false,

      message: "User not found",
    });
  }

  if (user.role === "SUPER_ADMIN") {
    return res.status(403).json({
      success: false,

      message: "Super Admin cannot be deleted",
    });
  }

  await user.deleteOne();

  res.json({
    success: true,

    message: "User deleted successfully",
  });
});


