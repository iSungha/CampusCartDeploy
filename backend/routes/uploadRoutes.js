const express = require("express");

const { protect } = require("../middleware/authMiddleware");
const { uploadImage } = require("../middleware/uploadMiddleware");
const { uploadBufferToCloudinary } = require("../utils/cloudinaryUpload");

const router = express.Router();

const singleImageUpload = (req, res, next) => {
  uploadImage.single("image")(req, res, (error) => {
    if (error) {
      return res.status(400).json({
        message: "Image upload failed",
        error: error.message
      });
    }

    next();
  });
};

// POST /api/uploads/listing-image
router.post("/listing-image", protect, singleImageUpload, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "No image uploaded. Use form-data key: image"
      });
    }

    const result = await uploadBufferToCloudinary({
      buffer: req.file.buffer,
      folder: "campuscart/listings"
    });

    res.status(201).json({
      message: "Image uploaded successfully",
      image: {
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes
      }
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to upload image to Cloudinary",
      error: error.message
    });
  }
});

module.exports = router;