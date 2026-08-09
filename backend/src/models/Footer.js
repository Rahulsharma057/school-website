const mongoose = require("mongoose");

const footerLinkSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    label: { type: String, required: true, trim: true, maxlength: 100 },
    url: { type: String, required: true, trim: true },
    order: { type: Number, default: 0 },
    openInNewTab: { type: Boolean, default: false },
  },
  { _id: false },
);

const footerSectionSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    title: { type: String, required: true, trim: true, maxlength: 100 },
    order: { type: Number, default: 0 },
    links: [footerLinkSchema],
  },
  { _id: false },
);

const SOCIAL_PLATFORMS = [
  "facebook",
  "instagram",
  "twitter",
  "linkedin",
  "youtube",
  "whatsapp",
  "pinterest",
  "github",
  "telegram",
  "custom",
];

const socialLinkSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    platform: { type: String, enum: SOCIAL_PLATFORMS, default: "custom" },
    label: { type: String, default: "" }, // shown as the tooltip, mainly used when platform is "custom"
    url: { type: String, required: true, trim: true },
    order: { type: Number, default: 0 },
  },
  { _id: false },
);

const footerSchema = new mongoose.Schema(
  {
    // The footer is a singleton — this fixed key is how the controller
    // always finds the one document instead of guessing an _id.
    key: {
      type: String,
      required: true,
      unique: true,
      default: "main",
    },

    sections: [footerSectionSchema],
    socialLinks: [socialLinkSchema],

    branding: {
      showLogo: { type: Boolean, default: true },
      logoUrl: { type: String, default: "" },
      logoPublicId: { type: String, default: "" },
      description: { type: String, default: "", maxlength: 300 },
    },

    // Supports a {year} token, replaced with the current year at render time.
    copyrightText: {
      type: String,
      default: "© {year} All rights reserved.",
      maxlength: 200,
    },

    style: {
      bgColor: { type: String, default: "#18181b" },
      textColor: { type: String, default: "#d4d4d8" },
      headingColor: { type: String, default: "#ffffff" },
      linkColor: { type: String, default: "#a1a1aa" },
      linkHoverColor: { type: String, default: "#ffffff" },
      borderColor: { type: String, default: "#27272a" },
      columns: { type: Number, enum: [2, 3, 4, 5, 6], default: 4 },
      alignment: { type: String, enum: ["left", "center"], default: "left" },
      showDivider: { type: Boolean, default: true },
      padding: { type: String, enum: ["compact", "comfortable", "spacious"], default: "comfortable" },
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Footer", footerSchema);
module.exports.SOCIAL_PLATFORMS = SOCIAL_PLATFORMS;
