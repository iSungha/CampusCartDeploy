import { useEffect, useId, useState } from "react";
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
  files = [],
  onFilesChange,
  existingImageUrls = [],
  onExistingImageUrlsChange,
  disabled = false,
}) {
  const inputId = useId();
  const hintId = `${inputId}-hint`;
  const selectedFiles = Array.isArray(files) ? files : [];
  const savedImageUrls = Array.isArray(existingImageUrls)
    ? existingImageUrls
    : [];
  const [previews, setPreviews] = useState([]);
  const currentImageCount = savedImageUrls.length + selectedFiles.length;

  useEffect(() => {
    const nextPreviews = selectedFiles.map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));

    setPreviews(nextPreviews);

    return () => {
      nextPreviews.forEach((preview) => URL.revokeObjectURL(preview.url));
    };
  }, [selectedFiles]);

  function handleFileSelection(event) {
    const chosenFiles = Array.from(event.target.files || []);

    // Allow the same file to be chosen again after it has been removed.
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

      const isDuplicate = [...selectedFiles, ...validFiles].some(
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

    onFilesChange?.([
      ...selectedFiles,
      ...validFiles.slice(0, remainingSlots),
    ]);
  }

  function removeSelectedFile(indexToRemove) {
    onFilesChange?.(
      selectedFiles.filter((_, index) => index !== indexToRemove)
    );
  }

  function removeExistingImage(indexToRemove) {
    onExistingImageUrlsChange?.(
      savedImageUrls.filter((_, index) => index !== indexToRemove)
    );
  }

  return (
    <section
      className="listing-image-uploader"
      aria-labelledby={`${inputId}-title`}
    >
      <div className="listing-image-upload-heading">
        <div>
          <span id={`${inputId}-title`} className="listing-image-upload-title">
            Product Images (optional)
          </span>
          <p>
            Select images from your device. CampusCart uploads each file to
            Cloudinary and saves the returned URL in the listing&apos;s
            imageUrls array.
          </p>
        </div>

        <span className="image-count-badge">
          {currentImageCount}/{MAX_LISTING_IMAGES}
        </span>
      </div>

      <label
        htmlFor={inputId}
        className={`image-file-picker ${
          disabled || currentImageCount >= MAX_LISTING_IMAGES ? "disabled" : ""
        }`}
      >
        <ImagePlus size={22} />
        <span>
          {currentImageCount ? "Add more images" : "Choose product images"}
        </span>
      </label>

      <input
        id={inputId}
        className="image-file-input"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        aria-describedby={hintId}
        disabled={disabled || currentImageCount >= MAX_LISTING_IMAGES}
        onChange={handleFileSelection}
      />

      {(savedImageUrls.length > 0 || previews.length > 0) && (
        <div className="listing-image-preview-grid">
          {savedImageUrls.map((url, index) => (
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

      <p id={hintId} className="field-hint">
        JPG, PNG, or WEBP. Maximum 5 MB per image and {MAX_LISTING_IMAGES}
        images per listing. Users never need to paste an image URL.
      </p>
    </section>
  );
}
