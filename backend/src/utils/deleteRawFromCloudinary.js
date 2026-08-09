const cloudinary = require("cloudinary").v2;

// PDFs live as resource_type "raw" on Cloudinary — the existing
// deleteFromCloudinary util (used for form-upload images) defaults to
// "image", so this is a small dedicated helper for raw assets.
const deleteRawFromCloudinary = (public_id) => {
  if (!public_id) return Promise.resolve();
  return cloudinary.uploader.destroy(public_id, { resource_type: "raw" });
};

module.exports = deleteRawFromCloudinary;