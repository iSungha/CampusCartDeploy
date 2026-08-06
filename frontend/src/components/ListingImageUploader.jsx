import { useEffect, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import toast from "react-hot-toast";

import {
  ALLOWED_LISTING_IMAGE_TYPES,
  MAX_LISTING_IMAGE_BYTES,
  MAX_LISTING_IMAGES,
} from "../api/uploadListingImages";

function formatFileSize(bytes) {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ListingImageUploader({
  files,
  onFilesChange,
  existingImageUrls = [],
  onExistingImageUrlsChange,
  disabled = false,
}) {
  const [previews, setPreviews] = useState([]);
  const currentImageCount = existingImageUrls.length + files.length;

  useEffect(() => {
    const nextPreviews = files.map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));

    setPreviews(nextPreviews);

    return () => {
      nextPreviews.forEach((preview) => URL.revokeObjectURL(preview.url));
    };
  }, [files]);

  function handleFileSelection(event) {
    const chosenFiles = Array.from(event.target.files || []);
    event.target.value = "";

    if (!chosenFiles.length) {
      return;
    }

    const remainingSlots = MAX_LISTING_IMAGES - currentImageCount;

    if (remainingSlots <= 0) {
      toast.error(`You can upload up to ${MAX_LISTING_IMAGES} images.`);
      return;
    }

    const validFiles = [];

    for (const file of chosenFiles) {
      if (!ALLOWED_LISTING_IMAGE_TYPES.includes(file.type)) {
        toast.error(`${file.name} must be a JPG, PNG, or WEBP image.`);
        continue;
      }

      if (file.size > MAX_LISTING_IMAGE_BYTES) {
        toast.error(`${file.name} is larger than 5 MB.`);
        continue;
      }

      const isDuplicate = [...files, ...validFiles].some(
        (currentFile) =>
          currentFile.name === file.name &&
          currentFile.size === file.size &&
          currentFile.lastModified === file.lastModified
      );

      if (!isDuplicate) {
        validFiles.push(file);
      }
    }

    if (validFiles.length > remainingSlots) {
      toast.error(
        `Only ${remainingSlots} more image${remainingSlots === 1 ? "" : "s"} can be added.`
      );
    }

    onFilesChange([...files, ...validFiles.slice(0, remainingSlots)]);
  }

  function removeSelectedFile(indexToRemove) {
    onFilesChange(files.filter((_, index) => index !== indexToRemove));
  }

  function removeExistingImage(indexToRemove) {
    onExistingImageUrlsChange?.(
      existingImageUrls.filter((_, index) => index !== indexToRemove)
    );
  }

  return (
    <section className="listing-image-uploader" aria-labelledby="image-upload-title">
      <div className="listing-image-upload-heading">
        <div>
          <span id="image-upload-title" className="listing-image-upload-title">
            Product Images (optional)
          </span>
          <p>
            Choose up to {MAX_LISTING_IMAGES} JPG, PNG, or WEBP files. Each image
            can be up to 5 MB.
          </p>
        </div>

        <span className="image-count-badge">
          {currentImageCount}/{MAX_LISTING_IMAGES}
        </span>
      </div>

      <label className={`image-file-picker ${disabled ? "disabled" : ""}`}>
        <ImagePlus size={22} />
        <span>{currentImageCount ? "Add more images" : "Choose product images"}</span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          disabled={disabled || currentImageCount >= MAX_LISTING_IMAGES}
          onChange={handleFileSelection}
        />
      </label>

      {(existingImageUrls.length > 0 || previews.length > 0) && (
        <div className="listing-image-preview-grid">
          {existingImageUrls.map((url, index) => (
            <article className="listing-image-preview" key={`${url}-${index}`}>
              <img src={url} alt={`Current listing image ${index + 1}`} />
              <span className="image-status-label">Current</span>
              <button
                type="button"
                aria-label={`Remove current image ${index + 1}`}
                onClick={() => removeExistingImage(index)}
                disabled={disabled}
              >
                <X size={16} />
              </button>
            </article>
          ))}

          {previews.map((preview, index) => (
            <article
              className="listing-image-preview"
              key={`${preview.file.name}-${preview.file.lastModified}`}
            >
              <img src={preview.url} alt={`Selected ${preview.file.name}`} />
              <span className="image-status-label new">New</span>
              <button
                type="button"
                aria-label={`Remove ${preview.file.name}`}
                onClick={() => removeSelectedFile(index)}
                disabled={disabled}
              >
                <X size={16} />
              </button>
              <small title={preview.file.name}>
                {preview.file.name} · {formatFileSize(preview.file.size)}
              </small>
            </article>
          ))}
        </div>
      )}

      <p className="field-hint">
        Images are uploaded securely to Cloudinary. CampusCart saves only the
        Cloudinary URLs returned by the backend.
      </p>
    </section>
  );
}
