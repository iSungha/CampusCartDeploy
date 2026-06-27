import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Save } from "lucide-react";
import toast from "react-hot-toast";

import api from "../api/api";
import Navbar from "../components/Navbar";

const categories = [
  { label: "Textbooks", value: "textbooks" },
  { label: "Electronics", value: "electronics" },
  { label: "Furniture", value: "furniture" },
  { label: "Room Essentials", value: "room-essentials" },
  { label: "Clothing", value: "clothing" },
  { label: "School Supplies", value: "school supplies" },
];

const conditions = [
  { label: "New", value: "new" },
  { label: "Like New", value: "like-new" },
  { label: "Used", value: "used" },
  { label: "Good", value: "good" },
];

export default function EditListing() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    category: "textbooks",
    condition: "used",
    imageUrl: "",
  });

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadListing() {
      try {
        setLoading(true);

        const response = await api.get(`/listings/${id}`);
        const listing = response.data.listing || response.data;

        setFormData({
          title: listing.title || "",
          description: listing.description || "",
          price: listing.price || "",
          category: listing.category || "textbooks",
          condition: listing.condition || "used",
          imageUrl: listing.imageUrls?.[0] || "",
        });
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

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setSubmitting(true);

      const imageUrls = formData.imageUrl.trim()
        ? [formData.imageUrl.trim()]
        : [];

      await api.put(`/listings/${id}`, {
        title: formData.title.trim(),
        description: formData.description.trim(),
        price: Number(formData.price),
        category: formData.category,
        condition: formData.condition,
        imageUrls,
      });

      toast.success("Listing updated.");
      navigate(`/listings/${id}`);
    } catch (error) {
      console.error("Update listing error:", error);
      toast.error(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Failed to update listing."
      );
    } finally {
      setSubmitting(false);
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
              />
            </label>

            <label>
              Description
              <textarea
                name="description"
                rows="5"
                value={formData.description}
                onChange={handleChange}
              />
            </label>

            <div className="cc-form-grid">
              <label>
                Price
                <input
                  type="number"
                  name="price"
                  min="1"
                  value={formData.price}
                  onChange={handleChange}
                />
              </label>

              <label>
                Category
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
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
                >
                  {conditions.map((condition) => (
                    <option key={condition.value} value={condition.value}>
                      {condition.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label>
              Image URL Optional
              <input
                type="url"
                name="imageUrl"
                value={formData.imageUrl}
                onChange={handleChange}
              />
            </label>

            <button
              className="primary-button full"
              type="submit"
              disabled={submitting}
            >
              <Save size={18} />
              {submitting ? "Saving..." : "Save Changes"}
            </button>
          </form>
        )}
      </main>
    </>
  );
}