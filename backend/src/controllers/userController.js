const asyncHandler = require("../helpers/asyncHandler");
const ApiResponse = require("../helpers/ApiResponse");

// PROFILE

exports.getProfile = asyncHandler(async (req, res) => {
  res.json(
    new ApiResponse(
      200,

      req.user,

      "User profile fetched successfully",
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
