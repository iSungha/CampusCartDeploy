const express = require("express");

const User = require("../models/User");
const Listing = require("../models/Listing");
const Inquiry = require("../models/Inquiry");
const { protect, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);
router.use(adminOnly);

// GET /api/admin/users
router.get("/users", async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });

    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch users",
      error: error.message
    });
  }
});

// PATCH /api/admin/users/:id/deactivate
router.patch("/users/:id/deactivate", async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({
        message: "Admin cannot deactivate their own account"
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    res.status(200).json({
      message: "User deactivated",
      user
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to deactivate user",
      error: error.message
    });
  }
});

// GET /api/admin/listings
router.get("/listings", async (req, res) => {
  try {
    const listings = await Listing.find()
      .populate("seller", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json(listings);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch listings",
      error: error.message
    });
  }
});

// PATCH /api/admin/listings/:id/remove
router.patch("/listings/:id/remove", async (req, res) => {
  try {
    const listing = await Listing.findByIdAndUpdate(
      req.params.id,
      { status: "removed" },
      { new: true }
    );

    if (!listing) {
      return res.status(404).json({
        message: "Listing not found"
      });
    }

    res.status(200).json({
      message: "Listing removed by admin",
      listing
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to remove listing",
      error: error.message
    });
  }
});

// GET /api/admin/metrics
router.get("/metrics", async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const verifiedUsers = await User.countDocuments({ isEmailVerified: true });
    const totalListings = await Listing.countDocuments();
    const activeListings = await Listing.countDocuments({ status: "active" });
    const removedListings = await Listing.countDocuments({ status: "removed" });
    const flaggedListings = await Listing.countDocuments({ isFlagged: true });
    const totalInquiries = await Inquiry.countDocuments();

    res.status(200).json({
      totalUsers,
      activeUsers,
      verifiedUsers,
      totalListings,
      activeListings,
      removedListings,
      flaggedListings,
      totalInquiries
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch metrics",
      error: error.message
    });
  }
});

module.exports = router;