const multer = require("multer");
const ApiError = require("../helpers/ApiError");

// Author photo is always a plain image (not a general "file" field like
// forms have) — kept simple and strict on purpose: images only, 5MB cap.
const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];

const storage = multer.memoryStorage();

const quoteUpload = multer({
  storage,

  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },

  fileFilter: (req, file, cb) => {
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new ApiError(400, `Image type not allowed: ${file.mimetype}`));
    }
  },
});

module.exports = quoteUpload;
