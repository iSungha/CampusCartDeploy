const express = require("express");

const Inquiry = require("../models/Inquiry");
const Listing = require("../models/Listing");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// POST /api/inquiries/listings/:listingId
router.post("/listings/:listingId", protect, async (req, res) => {
  try {
    const { message } = req.body;

    const listing = await Listing.findById(req.params.listingId);

    if (!listing || listing.status !== "active") {
      return res.status(404).json({
        message: "Listing not found"
      });
    }

    if (listing.seller.toString() === req.user._id.toString()) {
      return res.status(400).json({
        message: "You cannot send an inquiry to your own listing"
      });
    }

    const inquiry = await Inquiry.create({
      listing: listing._id,
      buyer: req.user._id,
      seller: listing.seller,
      message
    });

    res.status(201).json(inquiry);
  } catch (error) {
    res.status(400).json({
      message: "Failed to send inquiry",
      error: error.message
    });
  }
});

// GET /api/inquiries/received
router.get("/received", protect, async (req, res) => {
  try {
    const inquiries = await Inquiry.find({ seller: req.user._id })
      .populate("listing", "title price status")
      .populate("buyer", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json(inquiries);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch received inquiries",
      error: error.message
    });
  }
});

// GET /api/inquiries/sent
router.get("/sent", protect, async (req, res) => {
  try {
    const inquiries = await Inquiry.find({ buyer: req.user._id })
      .populate("listing", "title price status")
      .populate("seller", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json(inquiries);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch sent inquiries",
      error: error.message
    });
  }
});

module.exports = router;