const multer = require("multer");
const ApiError = require("../helpers/ApiError");

const allowedMimeTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

const storage = multer.memoryStorage();

const formEntryUpload = multer({
  storage,

  limits: {
    fileSize: 25 * 1024 * 1024,
    files: 10,
  },

  fileFilter: (req, file, cb) => {
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new ApiError(400, `File type not allowed: ${file.mimetype}`));
    }
  },
});

module.exports = formEntryUpload;