const mongoose = require("mongoose");

// Same pattern as Form's uploadedFileSchema — { url, public_id } from
// Cloudinary, kept as its own sub-schema so cover image and gallery
// images share the exact same shape.
const imageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    public_id: { type: String, required: true },
    alt: { type: String, default: "" }, // for accessibility / SEO
  },
  { _id: false },
);

const NEWS_STATUS = ["draft", "published", "archived"];

const newsSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: 200,
    },

    // Short tagline shown above/below the title on the card — optional,
    // separate from title so admins can have e.g. title="Annual Sports
    // Day 2026" + heading="Upcoming Event".
    heading: {
      type: String,
      trim: true,
      maxlength: 150,
      default: "",
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    // Short card-preview text. Kept separate from `content` so cards never
    // have to render/strip full HTML content just to show a snippet.
    excerpt: {
      type: String,
      trim: true,
      maxlength: 400,
      default: "",
    },

    // Full article body. Rendered on the detail view. Plain text/HTML —
    // if a rich-text editor is added later, this field doesn't need to
    // change shape.
    content: {
      type: String,
      required: [true, "Content is required"],
    },

    coverImage: {
      type: imageSchema,
      required: [true, "A cover image is required"],
    },

    // Extra images shown in the full detail view (gallery), not on cards.
    gallery: {
      type: [imageSchema],
      default: [],
    },

    tags: {
      type: [String],
      default: [],
      set: (tags) => (Array.isArray(tags) ? tags.map((t) => t.trim().toLowerCase()).filter(Boolean) : []),
    },

    category: {
      type: String,
      trim: true,
      default: "",
    },

    status: {
      type: String,
      enum: NEWS_STATUS,
      default: "draft",
      index: true,
    },

    // Set automatically when status flips to "published" for the first
    // time (see controller) — this is what public listings sort/filter
    // by, not createdAt, so an admin can backdate or schedule by editing
    // it directly.
    publishedAt: {
      type: Date,
      default: null,
      index: true,
    },

    // Manual drag-and-drop order, lower = shown first. New items get
    // appended (max existing order + 1) so drag-drop reordering only
    // ever needs to touch the items actually being moved, not the whole
    // collection.
    order: {
      type: Number,
      default: 0,
      index: true,
    },

    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },

    // Best-effort read counter — incremented via $inc on detail view,
    // not meant to be a precise analytics figure.
    views: {
      type: Number,
      default: 0,
    },

    author: {
      type: String,
      trim: true,
      default: "",
    },

    seo: {
      metaTitle: { type: String, trim: true, maxlength: 70, default: "" },
      metaDescription: { type: String, trim: true, maxlength: 160, default: "" },
    },
  },
  { timestamps: true },
);

// Public listing's main query shape: published items, newest/ordered first.
newsSchema.index({ status: 1, order: 1, publishedAt: -1 });
newsSchema.index({ status: 1, isFeatured: 1, publishedAt: -1 });

newsSchema.index({
  title: "text",
  excerpt: "text",
  tags: "text",
});

module.exports = mongoose.model("News", newsSchema);
module.exports.NEWS_STATUS = NEWS_STATUS;
