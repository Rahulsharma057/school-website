const cloudinary = require("../config/cloudinary");

const streamifier = require("streamifier");

// FIX: folder/resource_type are now parameters instead of hardcoded to
// "school-website/home-slider" — that folder was fine for the home
// slider's own use, but form-entry uploads (images, PDFs, docs) were
// silently landing in the same folder. `resource_type: "auto"` also
// lets Cloudinary correctly store non-image files (PDF/DOC/XLS) instead
// of assuming everything is an image.
const uploadToCloudinary = (file, { folder = "school-website/home-slider", resourceType = "auto" } = {}) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
      },

      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      },
    );

    streamifier.createReadStream(file.buffer).pipe(stream);
  });
};

module.exports = uploadToCloudinary;
