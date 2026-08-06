import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ExternalLink,
  RefreshCw,
  Send,
  UserRound,
} from "lucide-react";
import toast from "react-hot-toast";

import api from "../api/api";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";

function getId(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  return String(value._id || value.id || "");
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

function normalizeThread(responseData) {
  return responseData?.thread || responseData || null;
}

export default function InquiryThread() {
  const { threadId } = useParams();
  const { user } = useAuth();
  const messagesEndRef = useRef(null);

  const [thread, setThread] = useState(null);
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const loadThread = useCallback(
    async ({ refresh = false } = {}) => {
      try {
        refresh ? setRefreshing(true) : setLoading(true);
        setError("");

        const response = await api.get(`/inquiries/threads/${threadId}`);
        setThread(normalizeThread(response.data));

        // The backend marks incoming messages in this thread as read. Tell the
        // navbar to refresh immediately instead of waiting for the 30s poll.
        window.dispatchEvent(new Event("campuscart:inquiries-read"));
      } catch (requestError) {
        console.error("Load inquiry thread error:", requestError);
        setError(
          requestError.response?.data?.message ||
            "Failed to load this conversation."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [threadId]
  );

  useEffect(() => {
    loadThread();
  }, [loadThread]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread?.messages?.length]);

  async function handleReply(event) {
    event.preventDefault();
    const message = reply.trim();

    if (!message) {
      toast.error("Write a message before sending.");
      return;
    }

    try {
      setSubmitting(true);

      const response = await api.post(
        `/inquiries/threads/${threadId}/messages`,
        { message }
      );

      const sentMessage = response.data?.inquiry;

      if (sentMessage) {
        setThread((current) => ({
          ...current,
          messages: [...(current?.messages || []), sentMessage],
        }));
      } else {
        await loadThread({ refresh: true });
      }

      setReply("");
      toast.success("Reply sent.");
    } catch (requestError) {
      console.error("Send inquiry reply error:", requestError);
      toast.error(
        requestError.response?.data?.message || "Failed to send reply."
      );
    } finally {
      setSubmitting(false);
    }
  }

  const currentUserId = getId(user);
  const listing = thread?.listing || {};
  const otherUser = thread?.otherUser || {};

  return (
    <>
      <Navbar />

      <main className="page-container inquiry-thread-page">
        <div className="inquiry-thread-topbar">
          <Link to="/inquiries" className="back-button">
            <ArrowLeft size={16} />
            All conversations
          </Link>

          <button
            className="secondary-button small"
            type="button"
            onClick={() => loadThread({ refresh: true })}
            disabled={loading || refreshing}
          >
            <RefreshCw
              size={16}
              className={refreshing ? "spin-icon" : ""}
            />
            Refresh
          </button>
        </div>

        {loading && <p className="page-message">Loading conversation...</p>}

        {!loading && error && (
          <div className="empty-state">
            <h2>Conversation unavailable</h2>
            <p>{error}</p>
            <Link to="/inquiries" className="primary-button">
              Back to Conversations
            </Link>
          </div>
        )}

        {!loading && !error && thread && (
          <section className="inquiry-thread-shell">
            <header className="inquiry-thread-header">
              <div className="inquiry-thread-person">
                <span className="conversation-avatar">
                  <UserRound size={22} aria-hidden="true" />
                </span>
                <div>
                  <h1>{otherUser.name || "CampusCart user"}</h1>
                  <p>{otherUser.email || "CampusCart conversation"}</p>
                </div>
              </div>

              {getId(listing) && (
                <Link
                  to={`/listings/${getId(listing)}`}
                  className="inquiry-thread-listing"
                >
                  <div>
                    <small>Listing</small>
                    <strong>{listing.title || "View listing"}</strong>
                    {listing.price !== undefined && listing.price !== null && (
                      <span>${listing.price}</span>
                    )}
                  </div>
                  <ExternalLink size={18} aria-hidden="true" />
                </Link>
              )}
            </header>

            <div className="inquiry-message-history">
              {(thread.messages || []).map((message) => {
                const ownMessage = getId(message.sender) === currentUserId;

                return (
                  <div
                    className={`chat-message-row ${
                      ownMessage ? "own" : "other"
                    }`}
                    key={getId(message)}
                  >
                    <div className="chat-message-bubble">
                      <p>{message.message}</p>
                      <time>{formatDate(message.createdAt)}</time>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <form className="inquiry-reply-form" onSubmit={handleReply}>
              <label htmlFor="inquiry-reply">Reply</label>
              <textarea
                id="inquiry-reply"
                rows="4"
                maxLength={1000}
                value={reply}
                onChange={(event) => setReply(event.target.value)}
                placeholder={`Message ${otherUser.name || "this user"}...`}
                disabled={submitting}
              />

              <div className="inquiry-reply-actions">
                <small>{reply.length}/1000 characters</small>
                <button
                  className="primary-button"
                  type="submit"
                  disabled={submitting || !reply.trim()}
                >
                  <Send size={18} aria-hidden="true" />
                  {submitting ? "Sending..." : "Send Reply"}
                </button>
              </div>
            </form>
          </section>
        )}
      </main>
    </>
  );
}
