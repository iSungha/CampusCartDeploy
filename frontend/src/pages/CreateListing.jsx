import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PlusCircle } from "lucide-react";
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

export default function CreateListing() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    category: "textbooks",
    condition: "used",
    imageUrl: "",
  });

  const [submitting, setSubmitting] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
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
      setSubmitting(true);

      const imageUrls = formData.imageUrl.trim()
        ? [formData.imageUrl.trim()]
        : [];

      const response = await api.post("/listings", {
        title: formData.title.trim(),
        description: formData.description.trim(),
        price: Number(formData.price),
        category: formData.category,
        condition: formData.condition,
        imageUrls,
      });

      const createdListing = response.data.listing || response.data;

      toast.success("Listing created successfully.");
      navigate(`/listings/${createdListing._id}`);
    } catch (error) {
      console.error("Create listing error:", error);
      toast.error(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Failed to create listing."
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
          <p className="eyebrow">Sell an item</p>
          <h1>Create Listing</h1>
          <p>Add item details so other students can find and contact you.</p>
        </div>

        <form className="cc-form-card" onSubmit={handleSubmit}>
          <label>
            Listing Title
            <input
              type="text"
              name="title"
              placeholder="Used Psychology Textbook"
              value={formData.title}
              onChange={handleChange}
            />
          </label>

          <label>
            Description
            <textarea
              name="description"
              rows="5"
              placeholder="Describe the item condition, pickup location, and important details."
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
                placeholder="45"
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
              placeholder="https://example.com/item-image.jpg"
              value={formData.imageUrl}
              onChange={handleChange}
            />
          </label>

          <button className="primary-button full" type="submit" disabled={submitting}>
            <PlusCircle size={18} />
            {submitting ? "Creating..." : "Create Listing"}
          </button>
        </form>
      </main>
    </>
  );
}