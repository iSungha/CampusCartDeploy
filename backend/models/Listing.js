const mongoose = require("mongoose");

const listingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true
    },

    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true
    },

    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"]
    },

    category: {
      type: String,
      required: [true, "Category is required"],
      enum: [
        "textbooks",
        "electronics",
        "furniture",
        "clothing",
        "school supplies",
        "other"
      ]
    },

    condition: {
      type: String,
      required: [true, "Condition is required"],
      enum: ["new", "like new", "used", "fair"]
    },

    imageUrls: {
      type: [String],
      default: []
    },

    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    status: {
      type: String,
      enum: ["active", "sold", "removed"],
      default: "active"
    },

    isFlagged: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

// Server optimization 2: indexes match the browse, filter, sort, and
// seller-dashboard queries used by the application.
listingSchema.index({ status: 1, createdAt: -1 });
listingSchema.index({ status: 1, category: 1, condition: 1, price: 1 });
listingSchema.index({ seller: 1, createdAt: -1 });

module.exports = mongoose.model("Listing", listingSchema);