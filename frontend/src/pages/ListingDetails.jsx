import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Heart, Mail, Pencil } from "lucide-react";
import toast from "react-hot-toast";

import api from "../api/api";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";

const fallbackImages = {
  textbooks:
    "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=1000&auto=format&fit=crop",
  electronics:
    "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1000&auto=format&fit=crop",
  furniture:
    "https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=1000&auto=format&fit=crop",
  clothing:
    "https://images.unsplash.com/photo-1523381294911-8d3cead13475?w=1000&auto=format&fit=crop",
  "school supplies":
    "https://images.unsplash.com/photo-1456735190827-d1262f71b8a3?w=1000&auto=format&fit=crop",
  "room-essentials":
    "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=1000&auto=format&fit=crop",
};

function getListingImage(listing) {
  if (
    listing?.imageUrls &&
    listing.imageUrls.length > 0 &&
    listing.imageUrls[0]
  ) {
    return listing.imageUrls[0];
  }

  return (
    fallbackImages[listing?.category] ||
    "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1000&auto=format&fit=crop"
  );
}

function formatLabel(value) {
  if (!value) return "Not listed";

  return value
    .replace(/-/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function ListingDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchListing() {
      try {
        setLoading(true);
        setError("");

        const response = await api.get(`/listings/${id}`);
        setListing(response.data.listing || response.data);
      } catch (err) {
        console.error("Fetch listing details error:", err);
        setError(
          err.response?.data?.message ||
            "Failed to load listing details. Please try again."
        );
      } finally {
        setLoading(false);
      }
    }

    fetchListing();
  }, [id]);

  async function handleSave() {
    if (!isAuthenticated) {
      toast.error("Please login to save listings.");
      navigate("/login");
      return;
    }

    try {
      setSaving(true);

      const response = await api.post(`/listings/${id}/save`);
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

  const image = getListingImage(listing);

  const fallbackImage =
    fallbackImages[listing?.category] ||
    "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1000&auto=format&fit=crop";

  const sellerId =
    typeof listing?.seller === "object" ? listing?.seller?._id : listing?.seller;

  const isOwner = Boolean(user && sellerId && sellerId === user._id);

  return (
    <>
      <Navbar />

      <main className="page-container">
        <button
          className="back-button"
          type="button"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={16} />
          Back
        </button>

        {loading && <p className="page-message">Loading listing details...</p>}

        {!loading && error && (
          <div className="empty-state">
            <h2>Listing unavailable</h2>
            <p>{error}</p>
            <Link to="/listings" className="primary-button">
              Back to Listings
            </Link>
          </div>
        )}

        {!loading && !error && listing && (
          <section className="details-layout">
            <div className="details-image-card">
              <img
                src={image}
                alt={listing.title || "Listing"}
                onError={(event) => {
                  event.currentTarget.src = fallbackImage;
                }}
              />
            </div>

            <div className="details-card">
              <div className="details-title-row">
                <div>
                  <p className="eyebrow">
                    {formatLabel(listing.category) || "Listing"}
                  </p>
                  <h1>{listing.title}</h1>
                </div>

                <strong className="details-price">${listing.price}</strong>
              </div>

              <div className="listing-tags">
                <span>{formatLabel(listing.condition)}</span>
                <span>{formatLabel(listing.status || "active")}</span>
              </div>

              <div className="details-section">
                <h2>Description</h2>
                <p>{listing.description}</p>
              </div>

              <div className="details-section seller-box">
                <h2>Seller</h2>
                <p>{listing.seller?.name || "CampusCart Seller"}</p>
                <small>{listing.seller?.email || "University student"}</small>
              </div>

              <div className="details-actions">
                <button
                  className={`secondary-button ${
                    isSaved ? "is-saved-button" : ""
                  }`}
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                >
                  <Heart size={18} fill={isSaved ? "currentColor" : "none"} />
                  {saving ? "Saving..." : isSaved ? "Saved" : "Save Listing"}
                </button>

                {isOwner ? (
                  <Link
                    to={`/listings/${listing._id}/edit`}
                    className="primary-button"
                  >
                    <Pencil size={18} />
                    Edit Listing
                  </Link>
                ) : (
                  <Link
                    to={
                      isAuthenticated
                        ? `/listings/${listing._id}/contact`
                        : "/login"
                    }
                    className="primary-button"
                  >
                    <Mail size={18} />
                    Contact Seller
                  </Link>
                )}
              </div>
            </div>
          </section>
        )}
      </main>
    </>
  );
}