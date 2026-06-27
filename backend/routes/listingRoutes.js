const express = require("express");

const Listing = require("../models/Listing");
const User = require("../models/User");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// GET /api/listings
router.get("/", async (req, res) => {
  try {
    const {
      search,
      category,
      condition,
      sortBy = "createdAt",
      order = "desc",
      page = 1,
      limit = 10
    } = req.query;

    const filter = {
      status: "active"
    };

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } }
      ];
    }

    if (category) {
      filter.category = category;
    }

    if (condition) {
      filter.condition = condition;
    }

    const allowedSortFields = ["createdAt", "price", "title"];
    const safeSortBy = allowedSortFields.includes(sortBy)
      ? sortBy
      : "createdAt";

    const sortOrder = order === "asc" ? 1 : -1;
    const pageNumber = Math.max(Number(page), 1);
    const pageSize = Math.min(Math.max(Number(limit), 1), 50);
    const skip = (pageNumber - 1) * pageSize;

    const listings = await Listing.find(filter)
      .populate("seller", "name email")
      .sort({ [safeSortBy]: sortOrder })
      .skip(skip)
      .limit(pageSize);

    const total = await Listing.countDocuments(filter);

    res.status(200).json({
      listings,
      page: pageNumber,
      pages: Math.ceil(total / pageSize),
      total
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch listings",
      error: error.message
    });
  }
});

// GET /api/listings/my/listings
router.get("/my/listings", protect, async (req, res) => {
  try {
    const listings = await Listing.find({ seller: req.user._id }).sort({
      createdAt: -1
    });

    res.status(200).json(listings);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch your listings",
      error: error.message
    });
  }
});

// GET /api/listings/saved/me
router.get("/saved/me", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: "savedListings",
      populate: {
        path: "seller",
        select: "name email"
      }
    });

    res.status(200).json(user.savedListings);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch saved listings",
      error: error.message
    });
  }
});

// GET /api/listings/:id
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid listing ID."
      });
    }

    const listing = await Listing.findById(id).populate(
      "seller",
      "name email"
    );

    if (!listing || listing.status === "removed") {
      return res.status(404).json({
        message: "Listing not found"
      });
    }

    res.status(200).json(listing);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch listing",
      error: error.message
    });
  }
});

// POST /api/listings
router.post("/", protect, async (req, res) => {
  try {
    const { title, description, price, category, condition, imageUrls } =
      req.body;

    const listing = await Listing.create({
      title,
      description,
      price,
      category,
      condition,
      imageUrls,
      seller: req.user._id
    });

    res.status(201).json(listing);
  } catch (error) {
    res.status(400).json({
      message: "Failed to create listing",
      error: error.message
    });
  }
});

// PUT /api/listings/:id
router.put("/:id", protect, async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);

    if (!listing || listing.status === "removed") {
      return res.status(404).json({
        message: "Listing not found"
      });
    }

    const isOwner = listing.seller.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        message: "You can only update your own listings"
      });
    }

    const updatedListing = await Listing.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json(updatedListing);
  } catch (error) {
    res.status(400).json({
      message: "Failed to update listing",
      error: error.message
    });
  }
});

// DELETE /api/listings/:id
router.delete("/:id", protect, async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);

    if (!listing || listing.status === "removed") {
      return res.status(404).json({
        message: "Listing not found"
      });
    }

    const isOwner = listing.seller.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        message: "You can only delete your own listings"
      });
    }

    listing.status = "removed";
    await listing.save();

    res.status(200).json({
      message: "Listing removed successfully",
      listing
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete listing",
      error: error.message
    });
  }
});

// POST /api/listings/:id/save
router.post("/:id/save", protect, async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);

    if (!listing || listing.status !== "active") {
      return res.status(404).json({
        message: "Listing not found"
      });
    }

    const user = await User.findById(req.user._id);

    const alreadySaved = user.savedListings.some(
      (savedId) => savedId.toString() === listing._id.toString()
    );

    if (alreadySaved) {
      user.savedListings = user.savedListings.filter(
        (savedId) => savedId.toString() !== listing._id.toString()
      );

      await user.save();

      return res.status(200).json({
        message: "Listing removed from saved listings"
      });
    }

    user.savedListings.push(listing._id);
    await user.save();

    res.status(200).json({
      message: "Listing saved successfully"
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to save listing",
      error: error.message
    });
  }
});

module.exports = router;