const { PassThrough } = require("stream");
const cloudinary = require("../config/cloudinary");

const ensureCloudinaryConfig = () => {
  const requiredEnvVars = [
    "CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_API_SECRET"
  ];

  const missingVars = requiredEnvVars.filter((key) => !process.env[key]);

  if (missingVars.length > 0) {
    throw new Error(
      `Missing Cloudinary configuration: ${missingVars.join(", ")}`
    );
  }
};

const uploadBufferToCloudinary = ({ buffer, folder = "campuscart/listings" }) => {
  ensureCloudinaryConfig();

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        use_filename: true,
        unique_filename: true
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }

        return resolve(result);
      }
    );

    const bufferStream = new PassThrough();
    bufferStream.end(buffer);
    bufferStream.pipe(uploadStream);
  });
};

module.exports = {
  uploadBufferToCloudinary
};