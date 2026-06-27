import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Send } from "lucide-react";
import toast from "react-hot-toast";

import api from "../api/api";
import Navbar from "../components/Navbar";

export default function ContactSeller() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [listing, setListing] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadListing() {
      try {
        setLoading(true);
        const response = await api.get(`/listings/${id}`);
        setListing(response.data.listing || response.data);
      } catch (error) {
        console.error("Load listing for inquiry error:", error);
        toast.error("Failed to load listing.");
      } finally {
        setLoading(false);
      }
    }

    loadListing();
  }, [id]);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!message.trim()) {
      toast.error("Message is required.");
      return;
    }

    try {
      setSubmitting(true);

      await api.post(`/inquiries/listings/${id}`, {
        message: message.trim(),
      });

      toast.success("Inquiry sent to seller.");
      navigate(`/listings/${id}`);
    } catch (error) {
      console.error("Send inquiry error:", error);
      toast.error(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Failed to send inquiry."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Navbar />

      <main className="page-container">
        <Link to={`/listings/${id}`} className="back-button">
          <ArrowLeft size={16} />
          Back to listing
        </Link>

        <div className="page-header">
          <p className="eyebrow">Buyer inquiry</p>
          <h1>Contact Seller</h1>
          <p>Send a message about this listing.</p>
        </div>

        {loading && <p className="page-message">Loading listing...</p>}

        {!loading && listing && (
          <div className="cc-two-column">
            <div className="cc-summary-card">
              <h2>{listing.title}</h2>
              <strong>${listing.price}</strong>
              <p>{listing.description}</p>
              <div className="cc-card-tags">
                <span>{listing.category}</span>
                <span>{listing.condition}</span>
              </div>
            </div>

            <form className="cc-form-card" onSubmit={handleSubmit}>
              <label>
                Message
                <textarea
                  rows="7"
                  placeholder="Hi, is this still available? I can meet near campus."
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                />
              </label>

              <button
                className="primary-button full"
                type="submit"
                disabled={submitting}
              >
                <Send size={18} />
                {submitting ? "Sending..." : "Send Inquiry"}
              </button>
            </form>
          </div>
        )}
      </main>
    </>
  );
}