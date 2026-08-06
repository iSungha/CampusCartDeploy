import api from "./api";

export const MAX_LISTING_IMAGES = 5;
export const MAX_LISTING_IMAGE_BYTES = 5 * 1024 * 1024;
export const ALLOWED_LISTING_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

export async function uploadListingImages(files = []) {
  const uploadedUrls = [];

  // The backend upload endpoint accepts one multipart file at a time using
  // the form-data key `image`, so multiple selected files are uploaded one
  // after another and their returned Cloudinary URLs are collected.
  for (const file of files) {
    const formData = new FormData();
    formData.append("image", file);

    const response = await api.post("/uploads/listing-image", formData);
    const cloudinaryUrl = response.data?.image?.url;

    if (!cloudinaryUrl) {
      throw new Error(`Cloudinary did not return a URL for ${file.name}.`);
    }

    uploadedUrls.push(cloudinaryUrl);
  }

  return uploadedUrls;
}
