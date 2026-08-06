import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Save } from "lucide-react";
import toast from "react-hot-toast";

import api from "../api/api";
import { uploadListingImages } from "../api/uploadListingImages";
import AiDescriptionAssistant from "../components/AiDescriptionAssistant";
import ListingImageUploader from "../components/ListingImageUploader";
import Navbar from "../components/Navbar";

const categories = [
  { label: "Textbooks", value: "textbooks" },
  { label: "Electronics", value: "electronics" },
  { label: "Furniture", value: "furniture" },
  { label: "Clothing", value: "clothing" },
  { label: "School Supplies", value: "school supplies" },
  { label: "Other", value: "other" },
];

const conditions = [
  { label: "New", value: "new" },
  { label: "Like New", value: "like new" },
  { label: "Used", value: "used" },
  { label: "Fair", value: "fair" },
];

export default function EditListing() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    notes: "",
    price: "",
    category: "textbooks",
    condition: "used",
  });
  const [existingImageUrls, setExistingImageUrls] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitStage, setSubmitStage] = useState("");

  const submitting = Boolean(submitStage);

  useEffect(() => {
    async function loadListing() {
      try {
        setLoading(true);

        const response = await api.get(`/listings/${id}`);
        const listing = response.data.listing || response.data;

        setFormData({
          title: listing.title || "",
          description: listing.description || "",
          notes: "",
          price: listing.price || "",
          category: listing.category || "textbooks",
          condition: listing.condition || "used",
        });
        setExistingImageUrls(
          Array.isArray(listing.imageUrls) ? listing.imageUrls : []
        );
      } catch (error) {
        console.error("Load listing for edit error:", error);
        toast.error("Failed to load listing.");
      } finally {
        setLoading(false);
      }
    }

    loadListing();
  }, [id]);

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function setGeneratedDescription(description) {
    setFormData((previous) => ({ ...previous, description }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!formData.title.trim()) {
      toast.error("Title is required.");
      return;
    }

    if (!formData.description.trim()) {
      toast.error("Description is required.");
      return;
    }

    if (!formData.price || Number(formData.price) <= 0) {
      toast.error("Price must be greater than 0.");
      return;
    }

    try {
      let newlyUploadedUrls = [];

      if (imageFiles.length) {
        setSubmitStage("Uploading images...");
        newlyUploadedUrls = await uploadListingImages(imageFiles);
      }

      setSubmitStage("Saving changes...");

      await api.put(`/listings/${id}`, {
        title: formData.title.trim(),
        description: formData.description.trim(),
        price: Number(formData.price),
        category: formData.category,
        condition: formData.condition,
        imageUrls: [...existingImageUrls, ...newlyUploadedUrls],
      });

      toast.success("Listing updated.");
      navigate(`/listings/${id}`);
    } catch (error) {
      console.error("Update listing error:", error);
      toast.error(
        error.response?.data?.message ||
          error.response?.data?.error ||
          error.message ||
          "Failed to update listing."
      );
    } finally {
      setSubmitStage("");
    }
  }

  return (
    <>
      <Navbar />

      <main className="page-container">
        <div className="page-header">
          <p className="eyebrow">Seller tools</p>
          <h1>Edit Listing</h1>
          <p>Update the details of your marketplace listing.</p>
        </div>

        {loading && <p className="page-message">Loading listing...</p>}

        {!loading && (
          <form className="cc-form-card" onSubmit={handleSubmit}>
            <label>
              Listing Title
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                disabled={submitting}
              />
            </label>

            <div className="cc-form-grid">
              <label>
                Price
                <input
                  type="number"
                  name="price"
                  min="1"
                  step="0.01"
                  value={formData.price}
                  onChange={handleChange}
                  disabled={submitting}
                />
              </label>

              <label>
                Category
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  disabled={submitting}
                >
                  {categories.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Condition
                <select
                  name="condition"
                  value={formData.condition}
                  onChange={handleChange}
                  disabled={submitting}
                >
                  {conditions.map((condition) => (
                    <option key={condition.value} value={condition.value}>
                      {condition.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <AiDescriptionAssistant
              title={formData.title}
              category={formData.category}
              condition={formData.condition}
              price={formData.price}
              notes={formData.notes}
              onNotesChange={handleChange}
              onDescriptionGenerated={setGeneratedDescription}
            />

            <label>
              Product Description
              <textarea
                name="description"
                rows="6"
                value={formData.description}
                onChange={handleChange}
                disabled={submitting}
              />
            </label>

            <ListingImageUploader
              files={imageFiles}
              onFilesChange={setImageFiles}
              existingImageUrls={existingImageUrls}
              onExistingImageUrlsChange={setExistingImageUrls}
              disabled={submitting}
            />

            <button
              className="primary-button full"
              type="submit"
              disabled={submitting}
            >
              <Save size={18} />
              {submitStage || "Save Changes"}
            </button>
          </form>
        )}
      </main>
    </>
  );
}
