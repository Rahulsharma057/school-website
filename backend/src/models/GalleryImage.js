const mongoose = require("mongoose");

const galleryImageSchema = new mongoose.Schema(
  {
    galleryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Gallery",
      required: true,
      index: true,
    },

    url: {
      type: String,
      required: true,
    },

    public_id: {
      type: String,
      required: true,
    },

    // Captured at upload time (from Cloudinary's own response) so the
    // frontend can reserve the correct aspect-ratio box before the image
    // loads — this is what prevents layout shift and lets masonry lay
    // tiles out without waiting on every image to load first.
    width: {
      type: Number,
      default: 0,
    },

    height: {
      type: Number,
      default: 0,
    },

    caption: {
      type: String,
      default: "",
      maxlength: 200,
    },

    altText: {
      type: String,
      default: "",
      maxlength: 200,
    },

    // Drag-and-drop position within the gallery — lower shows first.
    order: {
      type: Number,
      default: 0,
    },

    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true },
);

// The one index that matters for performance: fetching a gallery's
// images in display order, paginated, is the hot path for every
// preview widget and every "View All" scroll-load.
galleryImageSchema.index({ galleryId: 1, order: 1 });

module.exports = mongoose.model("GalleryImage", galleryImageSchema);
