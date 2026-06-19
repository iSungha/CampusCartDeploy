const multer = require("multer");

const allowedImageTypes = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp"
];

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (allowedImageTypes.includes(file.mimetype)) {
    return cb(null, true);
  }

  return cb(
    new Error("Only image files are allowed. Use JPG, JPEG, PNG, or WEBP.")
  );
};

const uploadImage = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1
  },
  fileFilter
});

module.exports = {
  uploadImage
};