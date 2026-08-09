const mongoose = require("mongoose");

// One entry per quote placed on this page. Kept as its own sub-schema
// (rather than just an array of ObjectIds) because a page needs to
// remember, PER QUOTE, its own visual overrides — two quotes on the
// same page can have opposite image positions, different photo sizes,
// different quote font sizes, etc. Anything left null falls back to
// this section's page-wide `layout` default at render time.
const sectionQuoteSchema = new mongoose.Schema(
  {
    quote: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quote",
      required: true,
    },

    imagePosition: { type: String, enum: ["left", "right", null], default: null },
    photoSize: { type: String, enum: ["sm", "md", "lg", "xl", null], default: null },
    photoShape: { type: String, enum: ["round", "square", null], default: null },
    // "avatar": small circular/square headshot beside the quote (default look).
    // "full": a larger, more prominent photo — a featured-image feel.
    imageDisplay: { type: String, enum: ["avatar", "full", null], default: null },
    fontSize: { type: String, enum: ["sm", "md", "lg", "xl", null], default: null },
    // Where the photo sits when the card stacks on a mobile screen —
    // independent of `imagePosition`, which only governs the desktop
    // left/right side-by-side layout. null = derive from imagePosition
    // (left -> top, right -> bottom) at render time.
    mobilePhotoPosition: { type: String, enum: ["top", "bottom", null], default: null },

    // Position within this page, independent of the quote's own global
    // `order` field (which only matters on the default /quotes wall).
    order: {
      type: Number,
      default: 0,
    },
  },
  { _id: false },
);

const quoteSectionSchema = new mongoose.Schema(
  {
    // Shown as the <h1>/page title on the public route, and as the
    // browser tab title via generateMetadata.
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: 150,
    },

    // Public route: /quotes/:slug
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

    // The specific quotes on this page, and their per-quote overrides —
    // this is what makes a page a curated selection rather than "every
    // quote that happens to match a filter".
    quotes: [sectionQuoteSchema],

    // Everything an admin can customize about how this page looks by
    // default — mirrors the Form model's `layout` block. Every field
    // here is the PAGE-WIDE DEFAULT; individual quotes above can
    // override some of them (see sectionQuoteSchema).
    layout: {
      // Cards per row on desktop/tablet (also: cards visible at once
      // when displayStyle is "slider").
      columns: { type: Number, enum: [1, 2, 3], default: 2 },
      // Cards per row on mobile — decoupled from `columns` on purpose,
      // since "2 columns" that looks fine on desktop is usually too
      // cramped on a phone unless an admin explicitly wants it. Also
      // used as "cards visible at once" on mobile in slider mode.
      mobileColumns: { type: Number, enum: [1, 2], default: 1 },

      // "grid": a card grid using columns/mobileColumns above.
      // "list": one full-width, wider strip per quote, stacked
      //   vertically — ignores columns/mobileColumns entirely.
      // "slider": a horizontally scrollable carousel with prev/next
      //   controls, showing columns/mobileColumns cards at a time.
      displayStyle: { type: String, enum: ["grid", "list", "slider"], default: "grid" },

      imagePosition: { type: String, enum: ["left", "right"], default: "right" },
      cardStyle: { type: String, enum: ["bordered", "plain", "minimal"], default: "bordered" },
      width: { type: String, enum: ["sm", "md", "lg", "xl", "full"], default: "lg" },
      primaryColor: { type: String, default: "#18181b" },

      // Author photo size preset. Actual pixel values are resolved on
      // the frontend (QuoteCard) so both this and every per-quote
      // override stay in sync automatically if that scale ever changes.
      photoSize: { type: String, enum: ["sm", "md", "lg", "xl"], default: "md" },
      photoShape: { type: String, enum: ["round", "square"], default: "round" },
      // "avatar" (small headshot, default) or "full" (larger, featured
      // photo) — see sectionQuoteSchema.imageDisplay above.
      imageDisplay: { type: String, enum: ["avatar", "full"], default: "avatar" },

      // Quote text size preset — line-height/spacing scale together
      // with this automatically on the frontend, so an admin only ever
      // picks a size, never fiddles with raw pixel/line-height values.
      fontSize: { type: String, enum: ["sm", "md", "lg", "xl"], default: "md" },

      // Default mobile stacking position; null = derive from
      // imagePosition (see sectionQuoteSchema comment above).
      mobilePhotoPosition: { type: String, enum: ["top", "bottom", null], default: null },
    },

    // Optional page-wide call-to-action shown below ALL of this page's
    // quotes — e.g. a "View All Testimonials" button linking elsewhere.
    // Independent of each Quote's own optional per-card button (see
    // Quote.button) — this one applies once, to the whole page.
    // Entirely optional; `enabled: false` (the default) renders nothing.
    button: {
      enabled: { type: Boolean, default: false },
      label: { type: String, default: "View All", trim: true, maxlength: 60 },
      url: { type: String, default: "", trim: true, maxlength: 300 },
    },

    // How many quotes are visible at once before "Load more" reveals
    // the rest of this page's curated list (grid/list mode), or how
    // many cards show per slide (slider mode, alongside columns above).
    pageSize: {
      type: Number,
      default: 9,
      min: 3,
      max: 30,
    },

    status: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("QuoteSection", quoteSectionSchema);
