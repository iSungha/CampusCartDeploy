import { useCallback, useEffect, useState } from "react";
import {
  Ban,
  MessageSquare,
  Package,
  ShieldCheck,
  Trash2,
  Users,
} from "lucide-react";
import toast from "react-hot-toast";

import api from "../api/api";
import Navbar from "../components/Navbar";

const emptyMetrics = {
  totalUsers: 0,
  activeUsers: 0,
  verifiedUsers: 0,
  totalListings: 0,
  activeListings: 0,
  removedListings: 0,
  flaggedListings: 0,
  totalInquiries: 0,
};

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState(emptyMetrics);
  const [listings, setListings] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadAdminData = useCallback(async () => {
    try {
      setLoading(true);
      const [metricsResponse, listingsResponse, usersResponse] =
        await Promise.all([
          api.get("/admin/metrics"),
          api.get("/admin/listings"),
          api.get("/admin/users"),
        ]);

      setMetrics({ ...emptyMetrics, ...metricsResponse.data });
      setListings(
        Array.isArray(listingsResponse.data) ? listingsResponse.data : []
      );
      setUsers(Array.isArray(usersResponse.data) ? usersResponse.data : []);
    } catch (error) {
      console.error("Load admin dashboard error:", error);
      toast.error(
        error.response?.data?.message || "Failed to load admin dashboard."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAdminData();
  }, [loadAdminData]);

  async function removeListing(listingId) {
    const confirmed = window.confirm(
      "Remove this listing from the public marketplace?"
    );

    if (!confirmed) return;

    try {
      await api.patch(`/admin/listings/${listingId}/remove`);
      setListings((current) =>
        current.map((listing) =>
          listing._id === listingId
            ? { ...listing, status: "removed" }
            : listing
        )
      );
      setMetrics((current) => ({
        ...current,
        activeListings: Math.max(0, current.activeListings - 1),
        removedListings: current.removedListings + 1,
      }));
      toast.success("Listing removed by admin.");
    } catch (error) {
      console.error("Admin remove listing error:", error);
      toast.error(error.response?.data?.message || "Failed to remove listing.");
    }
  }

  async function deactivateUser(userId) {
    const confirmed = window.confirm(
      "Deactivate this account? The user will no longer be able to log in."
    );

    if (!confirmed) return;

    try {
      await api.patch(`/admin/users/${userId}/deactivate`);
      setUsers((current) =>
        current.map((account) =>
          account._id === userId ? { ...account, isActive: false } : account
        )
      );
      setMetrics((current) => ({
        ...current,
        activeUsers: Math.max(0, current.activeUsers - 1),
      }));
      toast.success("User deactivated.");
    } catch (error) {
      console.error("Admin deactivate user error:", error);
      toast.error(
        error.response?.data?.message || "Failed to deactivate user."
      );
    }
  }

  const metricCards = [
    {
      label: "Active users",
      value: metrics.activeUsers,
      detail: `${metrics.totalUsers} total`,
      icon: Users,
    },
    {
      label: "Active listings",
      value: metrics.activeListings,
      detail: `${metrics.totalListings} total`,
      icon: Package,
    },
    {
      label: "Flagged listings",
      value: metrics.flaggedListings,
      detail: `${metrics.removedListings} removed`,
      icon: ShieldCheck,
    },
    {
      label: "Inquiries",
      value: metrics.totalInquiries,
      detail: `${metrics.verifiedUsers} verified users`,
      icon: MessageSquare,
    },
  ];

  return (
    <>
      <Navbar />

      <main className="page-container admin-page">
        <div className="page-header dashboard-header">
          <div>
            <p className="eyebrow">Restricted area</p>
            <h1>Admin Dashboard</h1>
            <p>Review platform activity, listings, and user accounts.</p>
          </div>
        </div>

        {loading && <p className="page-message">Loading admin data...</p>}

        {!loading && (
          <>
            <section className="admin-metric-grid" aria-label="Platform metrics">
              {metricCards.map(({ label, value, detail, icon: Icon }) => (
                <article className="admin-metric-card" key={label}>
                  <div className="admin-metric-icon">
                    <Icon size={22} />
                  </div>
                  <div>
                    <p>{label}</p>
                    <strong>{value}</strong>
                    <small>{detail}</small>
                  </div>
                </article>
              ))}
            </section>

            <section className="admin-section">
              <div className="admin-section-heading">
                <div>
                  <h2>Listing moderation</h2>
                  <p>Removed listings remain visible here for audit purposes.</p>
                </div>
              </div>

              <div className="cc-table-card">
                <table className="cc-table">
                  <thead>
                    <tr>
                      <th>Listing</th>
                      <th>Seller</th>
                      <th>Price</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {listings.map((listing) => (
                      <tr key={listing._id}>
                        <td>
                          <span className="table-title">{listing.title}</span>
                          <small>{listing.category}</small>
                        </td>
                        <td>
                          {listing.seller?.name || "Unknown seller"}
                          <small>{listing.seller?.email || ""}</small>
                        </td>
                        <td>${listing.price}</td>
                        <td>
                          <span
                            className={`status-pill ${
                              listing.status === "removed" ? "is-removed" : ""
                            }`}
                          >
                            {listing.status || "active"}
                          </span>
                        </td>
                        <td>
                          <button
                            className="icon-action danger"
                            type="button"
                            aria-label={`Remove ${listing.title}`}
                            disabled={listing.status === "removed"}
                            onClick={() => removeListing(listing._id)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="admin-section">
              <div className="admin-section-heading">
                <div>
                  <h2>User management</h2>
                  <p>Deactivate accounts that violate marketplace rules.</p>
                </div>
              </div>

              <div className="cc-table-card">
                <table className="cc-table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Role</th>
                      <th>Verified</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((account) => (
                      <tr key={account._id}>
                        <td>
                          <span className="table-title">{account.name}</span>
                          <small>{account.email}</small>
                        </td>
                        <td>{account.role}</td>
                        <td>{account.isEmailVerified ? "Yes" : "No"}</td>
                        <td>
                          <span
                            className={`status-pill ${
                              account.isActive === false ? "is-removed" : ""
                            }`}
                          >
                            {account.isActive === false ? "inactive" : "active"}
                          </span>
                        </td>
                        <td>
                          <button
                            className="icon-action danger"
                            type="button"
                            aria-label={`Deactivate ${account.name}`}
                            disabled={
                              account.isActive === false || account.role === "admin"
                            }
                            onClick={() => deactivateUser(account._id)}
                          >
                            <Ban size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </main>
    </>
  );
}
