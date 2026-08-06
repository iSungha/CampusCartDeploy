import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Clock,
  MessageCircle,
  RefreshCw,
  UserRound,
} from "lucide-react";
import toast from "react-hot-toast";

import api from "../api/api";
import Navbar from "../components/Navbar";

function getId(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  return String(value._id || value.id || "");
}

function normalizeThreads(responseData) {
  if (Array.isArray(responseData)) return responseData;
  if (Array.isArray(responseData?.threads)) return responseData.threads;
  return [];
}

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getListingImage(listing) {
  if (Array.isArray(listing?.imageUrls) && listing.imageUrls[0]) {
    return listing.imageUrls[0];
  }

  return "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=240&auto=format&fit=crop";
}

function ConversationRow({ thread }) {
  const listing = thread?.listing || {};
  const otherUser = thread?.otherUser || {};
  const lastMessage = thread?.lastMessage || {};
  const threadId = thread?.threadId || getId(lastMessage);

  return (
    <Link to={`/inquiries/${threadId}`} className="conversation-row">
      <img
        src={getListingImage(listing)}
        alt=""
        className="conversation-listing-image"
        loading="lazy"
      />

      <div className="conversation-row-main">
        <div className="conversation-row-heading">
          <div>
            <h2>{otherUser.name || "CampusCart user"}</h2>
            <p>{listing.title || "Listing"}</p>
          </div>

          <time>{formatDate(thread.lastMessageAt)}</time>
        </div>

        <div className="conversation-row-preview">
          <p>{lastMessage.message || "Open conversation"}</p>

          {thread.unreadCount > 0 && (
            <span className="conversation-unread-badge">
              {thread.unreadCount}
            </span>
          )}
        </div>

        <div className="conversation-row-meta">
          {listing.price !== undefined && listing.price !== null && (
            <strong>${listing.price}</strong>
          )}
          <span>{thread.messageCount || 1} message(s)</span>
          <ArrowRight size={18} aria-hidden="true" />
        </div>
      </div>
    </Link>
  );
}

export default function Inquiries() {
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadThreads = useCallback(async ({ refresh = false } = {}) => {
    try {
      refresh ? setRefreshing(true) : setLoading(true);
      setError("");

      const response = await api.get("/inquiries/threads");
      setThreads(normalizeThreads(response.data));

      if (refresh) toast.success("Conversations refreshed.");
    } catch (requestError) {
      console.error("Load inquiry conversations error:", requestError);
      const message =
        requestError.response?.data?.message ||
        "Failed to load your conversations.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadThreads();
  }, [loadThreads]);

  return (
    <>
      <Navbar />

      <main className="page-container conversations-page">
        <div className="page-header conversations-header">
          <div>
            <p className="eyebrow">Buyer and seller messages</p>
            <h1>Conversations</h1>
            <p>
              Messages with the same buyer or seller are kept together for each
              listing.
            </p>
          </div>

          <button
            className="secondary-button"
            type="button"
            onClick={() => loadThreads({ refresh: true })}
            disabled={loading || refreshing}
          >
            <RefreshCw
              size={18}
              className={refreshing ? "spin-icon" : ""}
              aria-hidden="true"
            />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {loading && <p className="page-message">Loading conversations...</p>}

        {!loading && error && (
          <div className="empty-state">
            <h2>Conversations unavailable</h2>
            <p>{error}</p>
            <button
              className="primary-button"
              type="button"
              onClick={() => loadThreads()}
            >
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && threads.length === 0 && (
          <div className="empty-state conversation-empty-state">
            <MessageCircle size={38} aria-hidden="true" />
            <h2>No conversations yet</h2>
            <p>
              Contact a seller from a listing page. Replies from buyers and
              sellers will appear here in the same thread.
            </p>
            <Link to="/listings" className="primary-button">
              Browse Listings
            </Link>
          </div>
        )}

        {!loading && !error && threads.length > 0 && (
          <section className="conversation-list" aria-live="polite">
            <div className="conversation-list-title">
              <UserRound size={19} aria-hidden="true" />
              <strong>{threads.length} conversation(s)</strong>
              <span>
                <Clock size={16} aria-hidden="true" /> Most recent first
              </span>
            </div>

            {threads.map((thread) => (
              <ConversationRow key={thread.threadId} thread={thread} />
            ))}
          </section>
        )}
      </main>
    </>
  );
}
