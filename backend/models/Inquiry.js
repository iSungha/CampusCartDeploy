const mongoose = require("mongoose");

const inquirySchema = new mongoose.Schema(
  {
    listing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Listing",
      required: true
    },
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    // The original inquiry documents did not have sender. For those legacy
    // records the API treats buyer as the sender, so existing data still works.
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    message: {
      type: String,
      required: [true, "Inquiry message is required"],
      trim: true,
      maxlength: [1000, "Inquiry message cannot exceed 1000 characters"]
    },
    status: {
      type: String,
      enum: ["new", "read", "closed"],
      default: "new"
    }
  },
  {
    timestamps: true
  }
);

// A conversation is grouped by listing + buyer + seller. Each document is one
// message, which keeps the existing inquiry collection backward compatible.
inquirySchema.index({ listing: 1, buyer: 1, seller: 1, createdAt: 1 });
inquirySchema.index({ buyer: 1, createdAt: -1 });
inquirySchema.index({ seller: 1, createdAt: -1 });

module.exports = mongoose.model("Inquiry", inquirySchema);
