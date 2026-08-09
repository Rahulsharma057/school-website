const mongoose = require("mongoose");

// ================= IMAGE SCHEMA =================

const imageSchema = new mongoose.Schema(
  {
    url: { type: String, default: "" },
    public_id: { type: String, default: "" },
    alt: { type: String, default: "", maxlength: 200 },
    width: { type: Number, default: 1200 },
    height: { type: Number, default: 500 },
    objectFit: { type: String, enum: ["cover", "contain", "fill"], default: "cover" },
    position: { type: String, default: "center" },
    borderRadius: { type: Number, default: 0 },
  },
  { _id: false },
);

// ================= BUTTON SCHEMA =================

const buttonSchema = new mongoose.Schema(
  {
    text: { type: String, default: "", maxlength: 60 },
    link: { type: String, default: "" },
    style: { type: String, enum: ["primary", "secondary", "outline"], default: "primary" },
    openInNewTab: { type: Boolean, default: false },
  },
  { _id: false },
);

// ================= FAQ ITEM SCHEMA =================

const faqItemSchema = new mongoose.Schema(
  {
    question: { type: String, default: "", maxlength: 300 },
    answer: { type: String, default: "" },
  },
  { _id: false },
);

// ================= CARD ITEM SCHEMA =================

const cardItemSchema = new mongoose.Schema(
  {
    title: { type: String, default: "", maxlength: 100 },
    // FIX: NEW — a short line under the title, above the description.
    subheading: { type: String, default: "", maxlength: 150 },
    description: { type: String, default: "" },
    icon: { type: String, default: "" },
    image: imageSchema,
    button: buttonSchema,
  },
  { _id: false },
);

// ================= SECTION SCHEMA =================

const sectionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["hero", "text", "imageText", "gallery", "cards", "video", "cta", "faq", "contact"],
      required: true,
    },

    title: { type: String, default: "", maxlength: 150 },
    heading: { type: String, default: "", maxlength: 150 },
    subheading: { type: String, default: "", maxlength: 200 },
    description: { type: String, default: "" },
    content: { type: String, default: "" },
    videoUrl: { type: String, default: "" },

    image: imageSchema,
    image2: imageSchema,

    layout: { type: String, enum: ["left", "right", "top", "bottom", "center", "grid"], default: "left" },
    imageSize: { type: String, enum: ["small", "medium", "large"], default: "medium" },
    titleAlign: { type: String, enum: ["left", "center", "right"], default: "left" },
    subtitleAlign: { type: String, enum: ["left", "center", "right"], default: "left" },

    images: [imageSchema],
    faqItems: [faqItemSchema],
    cardItems: [cardItemSchema],
    button: buttonSchema,

    background: { type: String, default: "#ffffff" },
    textColor: { type: String, default: "#000000" },
    padding: { type: Number, default: 40 },
    borderRadius: { type: Number, default: 0 },
    columns: { type: Number, default: 3 }, // also doubles as "cards per row"

    cardLayout: { type: String, enum: ["grid", "row"], default: "grid" },
    cardStyle: { type: String, enum: ["elevated", "outlined", "flat"], default: "elevated" },

    // FIX: NEW — image shape for cards ("gol ya lamba" — round/square/etc)
    cardImageShape: {
      type: String,
      enum: ["square", "rounded", "circle", "wide"],
      default: "square",
    },

    // FIX: NEW — how each individual card is laid out internally:
    // "vertical" = image on top, text below (classic card, default).
    // "horizontal" = image on the left, text on the right, side by side.
    cardDirection: { type: String, enum: ["vertical", "horizontal"], default: "vertical" },

    // FIX: NEW — "auto" stretches the image to fill the card's width
    // (existing default behavior); "custom" uses an exact, fixed
    // cardImageWidth/cardImageHeight box regardless of the card's own
    // width, so images stay a consistent size even if cards wrap
    // responsively.
    cardImageSizeMode: { type: String, enum: ["auto", "custom"], default: "auto" },
    cardImageWidth: { type: Number, default: 200 }, // px — only used when cardImageSizeMode is "custom"
    cardImageHeight: { type: Number, default: 160 }, // px
    cardMinWidth: { type: Number, default: 220 }, // px — floor width per card (grid columns and row-scroll items both respect this)
    showCardHeading: { type: Boolean, default: true },

    // FIX: NEW — a section can have its own background image (distinct
    // from the content image/image2), with its own overlay, for a
    // hero-style banner look on any section, not just the page header.
    backgroundImage: imageSchema,
    backgroundOverlayColor: { type: String, default: "#000000" },
    backgroundOverlayOpacity: { type: Number, min: 0, max: 1, default: 0.4 },

    order: { type: Number, default: 0 },
  },
  { _id: true },
);

// ================= PAGE HEADER STYLE =================

const headerStyleSchema = new mongoose.Schema(
  {
    // FIX: NEW — turns the whole header block off. When false,
    // DynamicPageContent skips it entirely (page starts straight at
    // Content/Sections).
    enabled: { type: Boolean, default: true },

    // FIX: NEW — when false, the header still renders (title/short
    // description) but WITHOUT the cover image or dark overlay behind
    // it — just plain text on `headingBackground`, using `headingColor`.
    // Lets an admin who doesn't want a big banner photo still have a
    // clean text-only header.
    showBackground: { type: Boolean, default: true },

    contentPosition: {
      type: String,
      enum: [
        "top-left", "top-center", "top-right",
        "center-left", "center", "center-right",
        "bottom-left", "bottom-center", "bottom-right",
      ],
      default: "bottom-left",
    },
    overlayColor: { type: String, default: "#09090b" },
    overlayOpacity: { type: Number, min: 0, max: 1, default: 0.55 },
    minHeight: { type: Number, default: 420 },

    // FIX: NEW — independent of the overlay/background controls above,
    // so the heading text itself can have its own color and an optional
    // highlight box behind just the text.
    headingColor: { type: String, default: "#ffffff" },
    headingBackground: { type: String, default: "" }, // "" = no box behind the heading text
  },
  { _id: false },
);

// ================= MAIN PAGE =================

const customPageSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, "Title is required"], trim: true, maxlength: 150 },

    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    route: { type: String, required: true, unique: true, trim: true, index: true },

    shortDescription: { type: String, default: "", maxlength: 300 },
    content: { type: String, default: "" },

    coverImage: imageSchema,
    gallery: [imageSchema],
    sections: [sectionSchema],

    header: { type: headerStyleSchema, default: () => ({}) },

    buttonText: { type: String, default: "", maxlength: 60 },
    buttonLink: { type: String, default: "" },

    seoTitle: { type: String, default: "", maxlength: 70 },
    seoDescription: { type: String, default: "", maxlength: 200 },
    keywords: [{ type: String, trim: true }],

    pageType: {
      type: String,
      enum: [
        "About", "Founder", "Chairman", "Principal", "Director", "Trust",
        "Infrastructure", "Facilities", "Admission", "Gallery", "Contact", "General",
      ],
      default: "General",
    },

    pageWidth: { type: String, enum: ["small", "medium", "large", "full"], default: "large" },

    showInNavbar: { type: Boolean, default: false },
    navbarOrder: { type: Number, default: 0 },
    showInFooter: { type: Boolean, default: false },
    footerOrder: { type: Number, default: 0 },

    featured: { type: Boolean, default: false },
    status: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
);

customPageSchema.index({ showInNavbar: 1, navbarOrder: 1 });
customPageSchema.index({ showInFooter: 1, footerOrder: 1 });
customPageSchema.index({ status: 1, order: 1, createdAt: -1 });

module.exports = mongoose.model("CustomPage", customPageSchema);
