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
