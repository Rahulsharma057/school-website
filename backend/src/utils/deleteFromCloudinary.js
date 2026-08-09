const cloudinary = require("../config/cloudinary");

const deleteFromCloudinary = async (public_id) => {
  if (!public_id) return;

  await cloudinary.uploader.destroy(public_id);
};

module.exports = deleteFromCloudinary;
