const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    label: { type: String, required: true, trim: true }, // "Head Office", "Admissions Office"
    addressLine: { type: String, required: true, trim: true },
    // Full Google Maps embed URL (admin pastes the iframe src) — kept
    // as a plain URL rather than lat/lng so admin needs zero technical
    // setup, just "Share > Embed a map > copy src" from Google Maps.
    mapEmbedUrl: { type: String, default: "" },
    showOnPage: { type: Boolean, default: true },
  },
  { _id: false },
);

const phoneSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    label: { type: String, required: true, trim: true }, // "Front Desk", "Admissions"
    number: { type: String, required: true, trim: true },
    enableCall: { type: Boolean, default: true },
    enableWhatsapp: { type: Boolean, default: true },
  },
  { _id: false },
);

const emailSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    label: { type: String, required: true, trim: true }, // "General Enquiries", "Admissions"
    address: { type: String, required: true, trim: true, lowercase: true },
  },
  { _id: false },
);

const SOCIAL_PLATFORMS = [
  "facebook",
  "instagram",
  "twitter",
  "youtube",
  "linkedin",
  "whatsapp",
  "telegram",
  "pinterest",
];

const socialLinkSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    platform: { type: String, enum: SOCIAL_PLATFORMS, required: true },
    url: { type: String, required: true, trim: true },
  },
  { _id: false },
);

const ROLE_VALUES = ["SUPER_ADMIN", "ADMIN", "EDITOR", "VIEWER"];

const contactPageSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: 150,
    },

    subtitle: {
      type: String,
      default: "",
      maxlength: 300,
    },

    // Public route: /contact/:slug
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    addresses: [addressSchema],
    phones: [phoneSchema],
    emails: [emailSchema],
    socialLinks: [socialLinkSchema],

    // Reuses the existing Form Builder module — the enquiry form on
    // this page, and its submissions/table, are the same Form/FormEntry
    // system already built. Nothing form-related is duplicated here.
    contactFormId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Form",
      default: null,
    },

    // Snapshot for display/linking convenience without an extra
    // populate() on every page load.
    contactFormSlug: {
      type: String,
      default: "",
    },

    layout: {
      style: {
        type: String,
        enum: ["split", "stacked"], // split = form beside details, stacked = form below
        default: "split",
      },
      primaryColor: {
        type: String,
        default: "#18181b",
      },
    },

    status: {
      type: Boolean,
      default: true,
    },

    accessControl: {
      viewRoles: {
        type: [String],
        enum: ROLE_VALUES,
        default: [], // empty = public — contact pages are public by default
      },
    },
  },
  { timestamps: true },
);

contactPageSchema.index({ status: 1 });

module.exports = mongoose.model("ContactPage", contactPageSchema);
module.exports.SOCIAL_PLATFORMS = SOCIAL_PLATFORMS;