const mongoose = require("mongoose");

const ROLE_VALUES = ["SUPER_ADMIN", "ADMIN", "EDITOR", "VIEWER"];

const PLACEMENT_VALUES = [
  "homepage-ticker",
  "navbar-ticker",
  "footer",
  "notice-board",
  "sidebar",
];

const LINK_TYPES = ["none", "internal", "external"];
const ANNOUNCEMENT_TYPES = ["general", "notice", "event", "urgent"];

const announcementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: 200,
    },

    // The 1-2 line text that actually scrolls in the ticker.
    tickerText: {
      type: String,
      required: [true, "Ticker text is required"],
      trim: true,
      maxlength: 220,
    },

    // Full body shown on the detail page when clicked.
    content: {
      type: String,
      default: "",
    },

    type: {
      type: String,
      enum: ANNOUNCEMENT_TYPES,
      default: "general",
    },

    link: {
      type: {
        type: String,
        enum: LINK_TYPES,
        default: "none",
      },
      // For "internal": a site-relative path (e.g. /admissions).
      // For "external": a full URL. Ignored for "none" — clicking then
      // just opens this announcement's own detail page.
      url: {
        type: String,
        default: "",
      },
    },

    attachment: {
      url: { type: String, default: "" },
      public_id: { type: String, default: "" },
      originalName: { type: String, default: "" },
    },

    // Public detail route: /announcements/:slug
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    priority: {
      type: Number,
      default: 0, // higher shows earlier among non-pinned items
    },

    pinned: {
      type: Boolean,
      default: false, // pinned items always lead, regardless of priority
    },

    // ---- Scheduling ----
    startDate: {
      type: Date,
      default: Date.now,
    },

    endDate: {
      type: Date,
      default: null, // null = never expires
    },

    status: {
      type: Boolean,
      default: true, // manual on/off switch, independent of the date window
    },

    placements: {
      type: [String],
      enum: PLACEMENT_VALUES,
      default: [],
    },

    accessControl: {
      viewRoles: {
        type: [String],
        enum: ROLE_VALUES,
        default: [], // empty = public
      },
    },
  },
  { timestamps: true },
);

announcementSchema.index({ status: 1, startDate: 1, endDate: 1 });
announcementSchema.index({ placements: 1, pinned: -1, priority: -1, createdAt: -1 });
announcementSchema.index({ title: "text", tickerText: "text" });

module.exports = mongoose.model("Announcement", announcementSchema);
module.exports.PLACEMENT_VALUES = PLACEMENT_VALUES;
module.exports.LINK_TYPES = LINK_TYPES;
module.exports.ANNOUNCEMENT_TYPES = ANNOUNCEMENT_TYPES;