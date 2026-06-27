import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart, MapPin } from "lucide-react";
import toast from "react-hot-toast";

import api from "../api/api";
import { useAuth } from "../context/AuthContext";

const fallbackImages = {
  textbooks:
    "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=900&auto=format&fit=crop",
  electronics:
    "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=900&auto=format&fit=crop",
  furniture:
    "https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=900&auto=format&fit=crop",
  clothing:
    "https://images.unsplash.com/photo-1523381294911-8d3cead13475?w=900&auto=format&fit=crop",
  "school supplies":
    "https://images.unsplash.com/photo-1456735190827-d1262f71b8a3?w=900&auto=format&fit=crop",
  "room-essentials":
    "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=900&auto=format&fit=crop",
};

function formatLabel(value) {
  if (!value) return "Not listed";

  return value
    .replace(/-/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getImage(listing) {
  if (listing.imageUrls && listing.imageUrls.length > 0 && listing.imageUrls[0]) {
    return listing.imageUrls[0];
  }

  return (
    fallbackImages[listing.category] ||
    "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=900&auto=format&fit=crop"
  );
}

export default function ListingCard({ listing }) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [saving, setSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const fallbackImage =
    fallbackImages[listing.category] ||
    "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=900&auto=format&fit=crop";

  async function handleSave(event) {
    event.preventDefault();
    event.stopPropagation();

    if (!isAuthenticated) {
      toast.error("Please login to save listings.");
      navigate("/login");
      return;
    }

    try {
      setSaving(true);

      const response = await api.post(`/listings/${listing._id}/save`);
      const message = response.data?.message || "Saved listings updated.";

      setIsSaved(!message.toLowerCase().includes("removed"));
      toast.success(message);
    } catch (error) {
      console.error("Save listing error:", error);
      toast.error(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Failed to save listing."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Link to={`/listings/${listing._id}`} className="cc-card">
      <div className="cc-card-image">
        <img
          src={getImage(listing)}
          alt={listing.title}
          onError={(event) => {
            event.currentTarget.src = fallbackImage;
          }}
        />

        <button
          className={`cc-card-save ${isSaved ? "is-saved" : ""}`}
          type="button"
          onClick={handleSave}
          disabled={saving}
          aria-label="Save listing"
        >
          <Heart size={18} fill={isSaved ? "currentColor" : "none"} />
        </button>
      </div>

      <div className="cc-card-body">
        <div className="cc-card-title-row">
          <h3>{listing.title}</h3>
          <strong>${listing.price}</strong>
        </div>

        <p className="cc-card-description">{listing.description}</p>

        <div className="cc-card-tags">
          <span>{formatLabel(listing.category)}</span>
          <span>{formatLabel(listing.condition)}</span>
        </div>

        <div className="cc-card-meta">
          <span>
            <MapPin size={14} />
            Campus
          </span>
          <span>{listing.seller?.name || "CampusCart Seller"}</span>
        </div>
      </div>
    </Link>
  );
}