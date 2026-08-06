import api from "./api";

export const MAX_LISTING_IMAGES = 5;
export const MAX_LISTING_IMAGE_BYTES = 5 * 1024 * 1024;
export const ALLOWED_LISTING_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

function getReturnedImageUrl(responseData) {
  return (
    responseData?.image?.url ||
    responseData?.image?.secure_url ||
    responseData?.url ||
    responseData?.secure_url ||
    ""
  );
}

function getUploadErrorMessage(error, fileName) {
  const apiMessage =
    error.response?.data?.message ||
    error.response?.data?.error ||
    error.message;

  return apiMessage
    ? `${fileName}: ${apiMessage}`
    : `${fileName}: image upload failed.`;
}

export async function uploadListingImages(files = []) {
  const selectedFiles = Array.isArray(files) ? files : [];
  const uploadedUrls = [];

  // The backend accepts one multipart file at a time using the form-data key
  // `image`. Axios/browser sets the multipart boundary automatically, so do
  // not manually set a Content-Type header here.
  for (const file of selectedFiles) {
    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await api.post("/uploads/listing-image", formData, {
        headers: {
          Accept: "application/json",
        },
      });

      const cloudinaryUrl = getReturnedImageUrl(response.data);

      if (!cloudinaryUrl) {
        throw new Error("Cloudinary did not return an image URL.");
      }

      uploadedUrls.push(cloudinaryUrl);
    } catch (error) {
      const uploadError = new Error(getUploadErrorMessage(error, file.name));
      uploadError.cause = error;
      throw uploadError;
    }
  }

  return uploadedUrls;
}
