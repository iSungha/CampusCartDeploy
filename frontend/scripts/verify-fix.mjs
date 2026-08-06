import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (relativePath) =>
  fs.readFileSync(path.join(root, relativePath), "utf8");

const failures = [];
const createListing = read("src/pages/CreateListing.jsx");
const uploader = read("src/components/ListingImageUploader.jsx");
const uploadApi = read("src/api/uploadListingImages.js");
const main = read("src/main.jsx");
const vercel = JSON.parse(read("vercel.json"));

if (/Image URL Optional|example\.com\/item-image/i.test(createListing)) {
  failures.push("CreateListing still contains the old manual Image URL field.");
}
if (!createListing.includes("<ListingImageUploader")) {
  failures.push("CreateListing does not render ListingImageUploader.");
}
if (!createListing.includes("uploadListingImages(imageFiles)")) {
  failures.push("CreateListing does not upload selected files before creating a listing.");
}
if (!uploadApi.includes('formData.append("image", file)')) {
  failures.push('Upload form-data key is not named "image".');
}
if (!uploadApi.includes('api.post("/uploads/listing-image"')) {
  failures.push("Cloudinary upload endpoint is incorrect.");
}
if (!createListing.includes("imageUrls,")) {
  failures.push("Created listing payload does not contain imageUrls.");
}
if (!uploader.includes('type="file"')) {
  failures.push("Uploader does not contain a browser file input.");
}
if (!main.includes("HashRouter")) {
  failures.push("HashRouter refresh fallback is missing.");
}
const hasSpaRewrite = Array.isArray(vercel.rewrites) && vercel.rewrites.some(
  (rule) => rule.source === "/(.*)" && rule.destination === "/index.html"
);
if (!hasSpaRewrite) {
  failures.push("Vercel SPA rewrite is missing.");
}

if (failures.length) {
  console.error("CampusCart fix verification FAILED:\n- " + failures.join("\n- "));
  process.exit(1);
}

console.log("CampusCart fix verification PASSED.");
console.log("- Manual image URL field removed");
console.log("- Browser file uploader present");
console.log("- POST /api/uploads/listing-image integration present");
console.log("- Returned URLs sent in listing imageUrls");
console.log("- Vercel SPA rewrite present");
console.log("- HashRouter refresh fallback present");
