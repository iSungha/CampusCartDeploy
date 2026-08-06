import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Edit, MessageSquare, PlusCircle, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

import api from "../api/api";
import Navbar from "../components/Navbar";

export default function SellerDashboard() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMyListings() {
      try {
        setLoading(true);

        const response = await api.get("/listings/my/listings");
        setListings(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error("Load dashboard listings error:", error);
        toast.error("Failed to load your listings.");
      } finally {
        setLoading(false);
      }
    }

    loadMyListings();
  }, []);

  async function handleDelete(id) {
    const confirmed = window.confirm(
      "Are you sure you want to remove this listing?"
    );

    if (!confirmed) return;

    try {
      await api.delete(`/listings/${id}`);

      toast.success("Listing removed.");
      setListings((prev) => prev.filter((listing) => listing._id !== id));
    } catch (error) {
      console.error("Delete listing error:", error);
      toast.error(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Failed to remove listing."
      );
    }
  }

  return (
    <>
      <Navbar />

      <main className="page-container">
        <div className="page-header dashboard-header">
          <div>
            <p className="eyebrow">Seller tools</p>
            <h1>Seller Dashboard</h1>
            <p>Manage the listings you posted on CampusCart.</p>
          </div>

          <div className="dashboard-header-actions">
            <Link to="/inquiries" className="secondary-button">
              <MessageSquare size={18} />
              View Inquiries
            </Link>

            <Link to="/sell" className="primary-button">
              <PlusCircle size={18} />
              New Listing
            </Link>
          </div>
        </div>

        {loading && <p className="page-message">Loading your listings...</p>}

        {!loading && listings.length === 0 && (
          <div className="empty-state">
            <h2>No listings yet</h2>
            <p>Create your first listing to start selling on CampusCart.</p>
            <Link to="/sell" className="primary-button">
              Create Listing
            </Link>
          </div>
        )}

        {!loading && listings.length > 0 && (
          <div className="cc-table-card">
            <table className="cc-table">
              <thead>
                <tr>
                  <th>Listing</th>
                  <th>Category</th>
                  <th>Condition</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {listings.map((listing) => (
                  <tr key={listing._id}>
                    <td>
                      <Link
                        to={`/listings/${listing._id}`}
                        className="table-title"
                      >
                        {listing.title}
                      </Link>
                      <small>{listing.description}</small>
                    </td>

                    <td>{listing.category}</td>
                    <td>{listing.condition}</td>
                    <td>${listing.price}</td>

                    <td>
                      <span className="status-pill">
                        {listing.status || "active"}
                      </span>
                    </td>

                    <td>
                      <div className="table-actions">
                        <Link
                          to={`/listings/${listing._id}/edit`}
                          className="icon-action"
                        >
                          <Edit size={16} />
                        </Link>

                        <button
                          className="icon-action danger"
                          type="button"
                          onClick={() => handleDelete(listing._id)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </>
  );
}