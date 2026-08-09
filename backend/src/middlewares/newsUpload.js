const multer = require("multer");
const ApiError = require("../helpers/ApiError");

// News only ever accepts images (cover + gallery) — kept stricter than
// formEntryUpload on purpose, no PDFs/docs needed here.
const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];

const storage = multer.memoryStorage();

const newsUpload = multer({
  storage,

  limits: {
    fileSize: 8 * 1024 * 1024, // 8MB per image
    files: 11, // 1 cover + up to 10 gallery images
  },

  fileFilter: (req, file, cb) => {
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new ApiError(400, `Only image files are allowed (got ${file.mimetype})`));
    }
  },
});

// Used on create/update: one "coverImage" file + up to 10 "gallery" files
// in the same multipart request.
const newsUploadFields = newsUpload.fields([
  { name: "coverImage", maxCount: 1 },
  { name: "gallery", maxCount: 10 },
]);

module.exports = { newsUpload, newsUploadFields };
