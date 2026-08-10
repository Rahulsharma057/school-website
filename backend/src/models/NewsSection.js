const mongoose = require("mongoose");

// An admin-configurable, routable "collection" of news — e.g. a homepage
// teaser widget or a dedicated "/news/collections/sports" page. Unlike
// QuoteSection (which picks specific quotes), this is FILTER-based —
// news keeps growing, so "show the latest 6 published articles tagged
// 'sports'" stays useful automatically, without an admin having to keep
// re-picking articles by hand every time a new one is published.
const newsSectionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: 150,
    },

    // Public route: /news/collections/:slug
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: 300,
    },

    // Which published articles this section pulls in — every field
    // optional; leave all empty to mean "every published article".
    filter: {
      category: { type: String, default: "", trim: true },
      tag: { type: String, default: "", trim: true, lowercase: true },
      featuredOnly: { type: Boolean, default: false },
    },

    layout: {
      columns: { type: Number, enum: [1, 2, 3, 4], default: 3 },
      mobileColumns: { type: Number, enum: [1, 2], default: 1 },
      // "grid": card grid using columns/mobileColumns.
      // "list": one full-width horizontal card per row.
      // "slider": horizontally scrollable carousel, columns/mobileColumns
      //   cards visible at a time, with prev/next controls.
      displayStyle: { type: String, enum: ["grid", "list", "slider"], default: "grid" },
      cardStyle: { type: String, enum: ["bordered", "plain", "minimal"], default: "bordered" },
      width: { type: String, enum: ["sm", "md", "lg", "xl", "full"], default: "lg" },
      primaryColor: { type: String, default: "#18181b" },
    },

    // Optional "View All" CTA below the grid — independent of the
    // per-card "View" button on each NewsCard.
    button: {
      enabled: { type: Boolean, default: true },
      label: { type: String, default: "View All News", trim: true, maxlength: 60 },
      url: { type: String, default: "/news", trim: true, maxlength: 300 },
    },

    pageSize: {
      type: Number,
      default: 6,
      min: 3,
      max: 24,
    },

    status: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("NewsSection", newsSectionSchema);
