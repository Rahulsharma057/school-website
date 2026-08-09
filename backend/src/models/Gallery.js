const mongoose = require("mongoose");

const LAYOUT_TYPES = ["grid", "masonry", "carousel"];

const gallerySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: 150,
    },

    // Public route: /gallery/:slug (the "View All" page)
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    heading: {
      type: String,
      default: "",
      maxlength: 150,
    },

    subheading: {
      type: String,
      default: "",
      maxlength: 250,
    },

    description: {
      type: String,
      default: "",
      maxlength: 500,
    },

    layout: {
      type: {
        type: String,
        enum: LAYOUT_TYPES,
        default: "grid",
      },
      columns: {
        type: Number,
        enum: [2, 3, 4, 5, 6],
        default: 4,
      },
      gap: {
        type: Number, // px
        default: 12,
      },
      rounded: {
        type: Boolean,
        default: true,
      },
    },

    // How many images the embedded preview widget shows before the
    // "View All" button — the full gallery page always paginates
    // through everything regardless of this number.
    previewCount: {
      type: Number,
      default: 8,
      min: 1,
      max: 50,
    },

    viewAllEnabled: {
      type: Boolean,
      default: true,
    },

    coverImage: {
      url: { type: String, default: "" },
      public_id: { type: String, default: "" },
    },

    status: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

gallerySchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model("Gallery", gallerySchema);
module.exports.LAYOUT_TYPES = LAYOUT_TYPES;
