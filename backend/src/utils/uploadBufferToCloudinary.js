const cloudinary = require("cloudinary").v2;

// Uploads an in-memory buffer (e.g. a server-generated PDF) directly —
// no multer file / disk path needed, unlike the existing
// uploadToCloudinary util which expects a multer file object.
const uploadBufferToCloudinary = (
  buffer,
  { folder = "syllabus", filename, resourceType = "raw" } = {},
) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType, // "raw" for PDFs
        public_id: filename,
        overwrite: true,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      },
    );

    stream.end(buffer);
  });

module.exports = uploadBufferToCloudinary;