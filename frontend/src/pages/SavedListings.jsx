import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import api from "../api/api";
import Navbar from "../components/Navbar";
import ListingCard from "../components/ListingCard";

export default function SavedListings() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSavedListings() {
      try {
        setLoading(true);

        const response = await api.get("/listings/saved/me");
        const data = response.data.savedListings || response.data || [];

        setListings(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Load saved listings error:", error);
        toast.error("Failed to load saved listings.");
      } finally {
        setLoading(false);
      }
    }

    loadSavedListings();
  }, []);

  return (
    <>
      <Navbar />

      <main className="page-container">
        <div className="page-header">
          <p className="eyebrow">Saved items</p>
          <h1>Saved Listings</h1>
          <p>Quickly return to items you are interested in buying.</p>
        </div>

        {loading && <p className="page-message">Loading saved listings...</p>}

        {!loading && listings.length === 0 && (
          <div className="empty-state">
            <h2>No saved listings yet</h2>
            <p>Save listings from the marketplace and they will appear here.</p>
          </div>
        )}

        {!loading && listings.length > 0 && (
          <div className="cc-market-grid">
            {listings.map((listing) => (
              <ListingCard key={listing._id} listing={listing} />
            ))}
          </div>
        )}
      </main>
    </>
  );
}