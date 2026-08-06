const express = require("express");
const mongoose = require("mongoose");

const Inquiry = require("../models/Inquiry");
const Listing = require("../models/Listing");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

function getId(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  return String(value._id || value.id || value);
}

function cleanMessage(value) {
  return typeof value === "string" ? value.trim() : "";
}

function validateMessage(message) {
  if (!message) {
    return "Message is required";
  }

  if (message.length > 1000) {
    return "Message cannot exceed 1000 characters";
  }

  return "";
}

function participantMatch(inquiry) {
  return {
    listing: inquiry.listing,
    buyer: inquiry.buyer,
    seller: inquiry.seller
  };
}

function isParticipant(inquiry, userId) {
  const normalizedUserId = String(userId);
  return (
    getId(inquiry.buyer) === normalizedUserId ||
    getId(inquiry.seller) === normalizedUserId
  );
}

function inferSender(inquiry) {
  // Old records were always created by the buyer, before sender existed.
  return inquiry.sender || inquiry.buyer;
}

function normalizeMessageDocument(inquiry) {
  if (!inquiry) return null;

  const raw = inquiry.toObject ? inquiry.toObject() : inquiry;

  return {
    ...raw,
    sender: raw.sender || raw.buyer
  };
}

async function findThreadSeed(threadId) {
  if (!mongoose.Types.ObjectId.isValid(threadId)) {
    return null;
  }

  return Inquiry.findById(threadId);
}

async function findCanonicalThreadId(match) {
  const firstMessage = await Inquiry.findOne(match)
    .sort({ createdAt: 1, _id: 1 })
    .select("_id")
    .lean();

  return firstMessage?._id?.toString() || "";
}

async function populateInquiry(inquiryId) {
  return Inquiry.findById(inquiryId)
    .populate("listing", "title price status imageUrls")
    .populate("buyer", "name email")
    .populate("seller", "name email")
    .populate("sender", "name email");
}

function createThreadSummary(messages, currentUserId) {
  const first = messages[0];
  const last = messages[messages.length - 1];
  const buyerId = getId(first.buyer);
  const sellerId = getId(first.seller);
  const currentUserIsBuyer = buyerId === currentUserId;
  const otherUser = currentUserIsBuyer ? first.seller : first.buyer;

  const unreadCount = messages.reduce((count, message) => {
    const senderId = getId(inferSender(message));
    return count + (senderId !== currentUserId && message.status === "new" ? 1 : 0);
  }, 0);

  return {
    threadId: getId(first),
    listing: first.listing,
    buyer: first.buyer,
    seller: first.seller,
    otherUser,
    currentUserRole: currentUserIsBuyer ? "buyer" : "seller",
    lastMessage: normalizeMessageDocument(last),
    lastMessageAt: last.createdAt,
    messageCount: messages.length,
    unreadCount
  };
}

// POST /api/inquiries/listings/:listingId
// Starts a conversation, or appends to the existing conversation for the same
// buyer and listing.
router.post("/listings/:listingId", protect, async (req, res) => {
  try {
    const message = cleanMessage(req.body.message);
    const validationError = validateMessage(message);

    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const listing = await Listing.findById(req.params.listingId);

    if (!listing || listing.status !== "active") {
      return res.status(404).json({ message: "Listing not found" });
    }

    if (listing.seller.toString() === req.user._id.toString()) {
      return res.status(400).json({
        message: "You cannot send an inquiry to your own listing"
      });
    }

    const match = {
      listing: listing._id,
      buyer: req.user._id,
      seller: listing.seller
    };

    const inquiry = await Inquiry.create({
      ...match,
      sender: req.user._id,
      message,
      status: "new"
    });

    const [threadId, populatedInquiry] = await Promise.all([
      findCanonicalThreadId(match),
      populateInquiry(inquiry._id)
    ]);

    return res.status(201).json({
      message: "Inquiry sent",
      threadId,
      inquiry: normalizeMessageDocument(populatedInquiry)
    });
  } catch (error) {
    return res.status(400).json({
      message: "Failed to send inquiry",
      error: error.message
    });
  }
});

// GET /api/inquiries/threads
// Returns one Marketplace-style conversation row per listing + buyer + seller.
router.get("/threads", protect, async (req, res) => {
  try {
    const currentUserId = req.user._id.toString();

    const inquiries = await Inquiry.find({
      $or: [{ buyer: req.user._id }, { seller: req.user._id }]
    })
      .populate("listing", "title price status imageUrls")
      .populate("buyer", "name email")
      .populate("seller", "name email")
      .populate("sender", "name email")
      .sort({ createdAt: 1, _id: 1 });

    const grouped = new Map();

    for (const inquiry of inquiries) {
      const key = [
        getId(inquiry.listing),
        getId(inquiry.buyer),
        getId(inquiry.seller)
      ].join(":");

      if (!grouped.has(key)) {
        grouped.set(key, []);
      }

      grouped.get(key).push(inquiry);
    }

    const threads = Array.from(grouped.values())
      .map((messages) => createThreadSummary(messages, currentUserId))
      .sort(
        (a, b) =>
          new Date(b.lastMessageAt).getTime() -
          new Date(a.lastMessageAt).getTime()
      );

    return res.status(200).json({ threads });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch inquiry conversations",
      error: error.message
    });
  }
});

// GET /api/inquiries/threads/:threadId
router.get("/threads/:threadId", protect, async (req, res) => {
  try {
    const seed = await findThreadSeed(req.params.threadId);

    if (!seed) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    if (!isParticipant(seed, req.user._id)) {
      return res.status(403).json({
        message: "You do not have access to this conversation"
      });
    }

    const match = participantMatch(seed);
    const messages = await Inquiry.find(match)
      .populate("listing", "title price status imageUrls")
      .populate("buyer", "name email")
      .populate("seller", "name email")
      .populate("sender", "name email")
      .sort({ createdAt: 1, _id: 1 });

    const currentUserId = req.user._id.toString();
    const unreadIncomingIds = messages
      .filter(
        (message) =>
          getId(inferSender(message)) !== currentUserId &&
          message.status === "new"
      )
      .map((message) => message._id);

    if (unreadIncomingIds.length > 0) {
      await Inquiry.updateMany(
        { _id: { $in: unreadIncomingIds } },
        { $set: { status: "read" } }
      );
    }

    const first = messages[0];
    const currentUserIsBuyer = getId(first.buyer) === currentUserId;

    return res.status(200).json({
      thread: {
        threadId: getId(first),
        listing: first.listing,
        buyer: first.buyer,
        seller: first.seller,
        otherUser: currentUserIsBuyer ? first.seller : first.buyer,
        currentUserRole: currentUserIsBuyer ? "buyer" : "seller",
        messages: messages.map((message) => {
          const normalized = normalizeMessageDocument(message);
          return unreadIncomingIds.some(
            (messageId) => messageId.toString() === message._id.toString()
          )
            ? { ...normalized, status: "read" }
            : normalized;
        })
      }
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch conversation",
      error: error.message
    });
  }
});

// POST /api/inquiries/threads/:threadId/messages
router.post("/threads/:threadId/messages", protect, async (req, res) => {
  try {
    const message = cleanMessage(req.body.message);
    const validationError = validateMessage(message);

    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const seed = await findThreadSeed(req.params.threadId);

    if (!seed) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    if (!isParticipant(seed, req.user._id)) {
      return res.status(403).json({
        message: "You do not have access to this conversation"
      });
    }

    const match = participantMatch(seed);
    const inquiry = await Inquiry.create({
      ...match,
      sender: req.user._id,
      message,
      status: "new"
    });

    const [threadId, populatedInquiry] = await Promise.all([
      findCanonicalThreadId(match),
      populateInquiry(inquiry._id)
    ]);

    return res.status(201).json({
      message: "Reply sent",
      threadId,
      inquiry: normalizeMessageDocument(populatedInquiry)
    });
  } catch (error) {
    return res.status(400).json({
      message: "Failed to send reply",
      error: error.message
    });
  }
});

// Existing endpoints are kept for backward compatibility with older clients.
router.get("/received", protect, async (req, res) => {
  try {
    const inquiries = await Inquiry.find({ seller: req.user._id })
      .populate("listing", "title price status")
      .populate("buyer", "name email")
      .populate("sender", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json(
      inquiries.map((inquiry) => normalizeMessageDocument(inquiry))
    );
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch received inquiries",
      error: error.message
    });
  }
});

router.get("/sent", protect, async (req, res) => {
  try {
    const inquiries = await Inquiry.find({ buyer: req.user._id })
      .populate("listing", "title price status")
      .populate("seller", "name email")
      .populate("sender", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json(
      inquiries.map((inquiry) => normalizeMessageDocument(inquiry))
    );
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch sent inquiries",
      error: error.message
    });
  }
});

module.exports = router;
