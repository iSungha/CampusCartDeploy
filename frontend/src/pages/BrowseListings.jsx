import { useEffect, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";

import api from "../api/api";
import Navbar from "../components/Navbar";
import ListingCard from "../components/ListingCard";

const categories = [
  { label: "All Categories", value: "" },
  { label: "Textbooks", value: "textbooks" },
  { label: "Electronics", value: "electronics" },
  { label: "Furniture", value: "furniture" },
  { label: "Clothing", value: "clothing" },
  { label: "School Supplies", value: "school supplies" },
  { label: "Other", value: "other" },
];

const conditions = [
  { label: "Any Condition", value: "" },
  { label: "New", value: "new" },
  { label: "Like New", value: "like new" },
  { label: "Used", value: "used" },
  { label: "Fair", value: "fair" },
];

function getParams(filters) {
  const activeSortBy = filters.sortBy || "createdAt";

  return {
    search: filters.search || undefined,
    category: filters.category || undefined,
    condition: filters.condition || undefined,
    sortBy: activeSortBy,
    order: activeSortBy === "price" ? "asc" : "desc",
  };
}

export default function BrowseListings() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [condition, setCondition] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");

  useEffect(() => {
    async function fetchInitialListings() {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/listings", {
          params: getParams({
            search: "",
            category: "",
            condition: "",
            sortBy: "createdAt",
          }),
        });

        const data = response.data?.listings || response.data || [];
        setListings(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Fetch listings error:", err);
        setError("Failed to load listings. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    fetchInitialListings();
  }, []);

  async function fetchListings(filters) {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/listings", {
        params: getParams(filters),
      });

      const data = response.data?.listings || response.data || [];
      setListings(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch listings error:", err);
      setError("Failed to load listings. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();

    fetchListings({
      search,
      category,
      condition,
      sortBy,
    });
  }

  function clearFilters() {
    setSearch("");
    setCategory("");
    setCondition("");
    setSortBy("createdAt");

    fetchListings({
      search: "",
      category: "",
      condition: "",
      sortBy: "createdAt",
    });
  }

  return (
    <>
      <Navbar />

      <main className="page-container">
        <div className="page-header">
          <div>
            <p className="eyebrow">Marketplace</p>
            <h1>Browse Listings</h1>
            <p>
              Find textbooks, electronics, furniture, and campus essentials from
              students near you.
            </p>
          </div>
        </div>

        <form className="filter-card" onSubmit={handleSubmit}>
          <div className="search-input-wrap">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search listings..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            {categories.map((item) => (
              <option key={item.label} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>

          <select
            value={condition}
            onChange={(event) => setCondition(event.target.value)}
          >
            {conditions.map((item) => (
              <option key={item.label} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value)}
          >
            <option value="createdAt">Newest</option>
            <option value="price">Price: Low to High</option>
            <option value="title">Title</option>
          </select>

          <button className="primary-button small" type="submit">
            <SlidersHorizontal size={16} />
            Apply
          </button>

          <button
            className="secondary-button small"
            type="button"
            onClick={clearFilters}
          >
            Clear
          </button>
        </form>

        {loading && <p className="page-message">Loading listings...</p>}

        {!loading && error && <p className="error-message">{error}</p>}

        {!loading && !error && listings.length === 0 && (
          <div className="empty-state">
            <h2>No listings found</h2>
            <p>Try changing your search or filters.</p>
          </div>
        )}

        {!loading && !error && listings.length > 0 && (
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