const mongoose = require("mongoose");

const quoteSchema = new mongoose.Schema(
  {
    quoteText: {
      type: String,
      required: [true, "Quote text is required"],
      trim: true,
      maxlength: 600,
    },

    authorName: {
      type: String,
      required: [true, "Author name is required"],
      trim: true,
      maxlength: 100,
    },

    // e.g. "Class 10 Student", "Parent", "Principal", "Alumni (2018)"
    authorTitle: {
      type: String,
      default: "",
      trim: true,
      maxlength: 100,
    },

    authorImage: {
      url: { type: String, default: "" },
      public_id: { type: String, default: "" },
    },

    // Optional free-text tag for grouping/filtering the public wall
    // (e.g. "Parent", "Alumni", "Staff") — not an enum since schools
    // will want different groupings without a code change.
    category: {
      type: String,
      default: "",
      trim: true,
      maxlength: 50,
    },

    // Optional per-card call-to-action — e.g. a quote from a specific
    // alumnus links to their full story. Independent of a Quote Page's
    // own page-wide "View All" button (QuoteSection.button); this one
    // travels WITH the quote itself, onto every card that quote appears
    // on, wherever it's used.
    button: {
      enabled: { type: Boolean, default: false },
      label: { type: String, default: "Read More", trim: true, maxlength: 60 },
      url: { type: String, default: "", trim: true, maxlength: 300 },
    },

    // Controls visibility on the public quotes wall — lets an admin
    // hide a quote without deleting it.
    status: {
      type: Boolean,
      default: true,
      index: true,
    },

    // Drag-and-drop position in the admin table; also the default sort
    // order on the public wall. New quotes are appended to the end.
    order: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

quoteSchema.index({ status: 1, order: 1 });

module.exports = mongoose.model("Quote", quoteSchema);
