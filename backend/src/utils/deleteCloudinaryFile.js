const cloudinary = require("../config/cloudinary");

const deleteCloudinaryFile = async (public_id) => {
  try {
    await cloudinary.uploader.destroy(public_id);
  } catch (error) {
    console.log("Cloudinary Delete Error", error.message);
  }
};

module.exports = deleteCloudinaryFile;
