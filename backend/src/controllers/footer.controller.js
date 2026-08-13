const { randomUUID } = require("crypto");
const CustomPage = require("../models/CustomPage");
const Footer = require("../models/Footer");
const getDefaultFooter = require("../utils/defaultFooter");

const uploadToCloudinary = require("../utils/uploadToCloudinary");
const deleteFromCloudinary = require("../utils/deleteFromCloudinary");

const asyncHandler = require("../helpers/asyncHandler");
const ApiResponse = require("../helpers/ApiResponse");
const ApiError = require("../helpers/ApiError");

const FOOTER_KEY = "main";

const VALID_PLATFORMS = Footer.SOCIAL_PLATFORMS;
const VALID_ALIGN = ["left", "center"];
const VALID_PADDING = ["compact", "comfortable", "spacious"];
const VALID_COLUMNS = [2, 3, 4, 5, 6];

// Fetches the singleton, auto-creating it from the default config the
// very first time anyone asks for it — so nothing else in the app has
// to special-case "no footer configured yet".
const getOrCreateFooter = async () => {
  let footer = await Footer.findOne({ key: FOOTER_KEY });

  if (!footer) {
    footer = await Footer.create({ key: FOOTER_KEY, ...getDefaultFooter() });
  }

  return footer;
};

// Fills in an id for any section/link that arrives without one (new
// items added on the client) and normalizes `order` to array position —
// this is what makes drag-and-drop as simple as "send the reordered array".
const normalizeSections = (sections = []) =>
  sections.map((section, sIndex) => ({
    id: section.id || randomUUID(),
    title: (section.title || "").trim() || "Untitled",
    order: sIndex,
    links: (section.links || []).map((link, lIndex) => {
      if (!link.label?.trim()) {
        throw new ApiError(400, "Every link needs a label");
      }
      if (!link.url?.trim()) {
        throw new ApiError(400, `Link "${link.label}" needs a URL`);
      }
      return {
        id: link.id || randomUUID(),
        label: link.label.trim(),
        url: link.url.trim(),
        order: lIndex,
        openInNewTab: Boolean(link.openInNewTab),
      };
    }),
  }));

const normalizeSocialLinks = (socialLinks = []) =>
  socialLinks.map((s, index) => {
    if (!s.url?.trim()) {
      throw new ApiError(400, "Every social link needs a URL");
    }

    const platform = VALID_PLATFORMS.includes(s.platform) ? s.platform : "custom";

    return {
      id: s.id || randomUUID(),
      platform,
      label: s.label || "",
      url: s.url.trim(),
      order: index,
    };
  });

const normalizeStyle = (style = {}, fallback = {}) => ({
  bgColor: style.bgColor || fallback.bgColor,
  textColor: style.textColor || fallback.textColor,
  headingColor: style.headingColor || fallback.headingColor,
  linkColor: style.linkColor || fallback.linkColor,
  linkHoverColor: style.linkHoverColor || fallback.linkHoverColor,
  borderColor: style.borderColor || fallback.borderColor,
  columns: VALID_COLUMNS.includes(Number(style.columns)) ? Number(style.columns) : fallback.columns,
  alignment: VALID_ALIGN.includes(style.alignment) ? style.alignment : fallback.alignment,
  showDivider: style.showDivider !== undefined ? Boolean(style.showDivider) : fallback.showDivider,
  padding: VALID_PADDING.includes(style.padding) ? style.padding : fallback.padding,
});

// ================= GET (public — also used by the admin builder to load current state) =================

const getFooter = asyncHandler(async (req, res) => {
  const footer = await getOrCreateFooter();
  return res.json(new ApiResponse(200, footer, "Footer fetched successfully"));
});

// ================= UPDATE =================

const updateFooter = asyncHandler(async (req, res) => {
  const footer = await getOrCreateFooter();

  const { sections, socialLinks, branding, copyrightText, style } = req.body;

  if (sections !== undefined) footer.sections = normalizeSections(sections);
  if (socialLinks !== undefined) footer.socialLinks = normalizeSocialLinks(socialLinks);
  if (copyrightText !== undefined) footer.copyrightText = copyrightText;

  if (branding !== undefined) {
    footer.branding.showLogo =
      branding.showLogo !== undefined ? Boolean(branding.showLogo) : footer.branding.showLogo;
    footer.branding.description =
      branding.description !== undefined ? branding.description : footer.branding.description;
    // logoUrl/logoPublicId are only ever changed via the dedicated
    // upload/remove endpoints below, never through this generic update —
    // that keeps the Cloudinary file and the DB field from drifting apart.
  }

  if (style !== undefined) footer.style = normalizeStyle(style, footer.style);

  await footer.save();

  return res.json(new ApiResponse(200, footer, "Footer updated successfully"));
});

// ================= LOGO UPLOAD / REMOVE =================

const uploadLogo = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, "A logo image is required");

  const footer = await getOrCreateFooter();
  const uploaded = await uploadToCloudinary(req.file);

  if (footer.branding.logoPublicId) {
    await deleteFromCloudinary(footer.branding.logoPublicId);
  }

  footer.branding.logoUrl = uploaded.url;
  footer.branding.logoPublicId = uploaded.public_id;
  footer.branding.showLogo = true;

  await footer.save();

  return res.json(new ApiResponse(200, footer, "Logo uploaded successfully"));
});

const removeLogo = asyncHandler(async (req, res) => {
  const footer = await getOrCreateFooter();

  if (footer.branding.logoPublicId) {
    await deleteFromCloudinary(footer.branding.logoPublicId);
  }

  footer.branding.logoUrl = "";
  footer.branding.logoPublicId = "";

  await footer.save();

  return res.json(new ApiResponse(200, footer, "Logo removed successfully"));
});

// ================= RESET TO DEFAULT =================

const resetFooter = asyncHandler(async (req, res) => {
  const footer = await getOrCreateFooter();

  // A full reset should leave nothing customized behind, including the
  // uploaded logo file itself.
  if (footer.branding.logoPublicId) {
    await deleteFromCloudinary(footer.branding.logoPublicId);
  }

  const defaults = getDefaultFooter();

  footer.sections = defaults.sections;
  footer.socialLinks = defaults.socialLinks;
  footer.branding = defaults.branding;
  footer.copyrightText = defaults.copyrightText;
  footer.style = defaults.style;

  await footer.save();

  return res.json(new ApiResponse(200, footer, "Footer reset to default"));
});

const getPublicFooter = asyncHandler(async (req, res) => {
  const footer = await getOrCreateFooter();
  const plain = footer.toObject ? footer.toObject() : footer;

  const dynamicPages = await CustomPage.find({
    showInFooter: true,
    status: true,
  })
    .select("title route footerOrder footerSectionId")
    .sort({ footerOrder: 1 })
    .lean();

  const sections = (plain.sections || []).map((s) => ({
    ...s,
    links: [...(s.links || [])],
  }));

  for (const page of dynamicPages) {
    // no matching/chosen section → page simply doesn't show in footer
    const target = page.footerSectionId
      ? sections.find((s) => s.id === page.footerSectionId)
      : null;

    if (!target) continue;

    target.links = [
      ...target.links,
      {
        id: `page-${page._id}`,
        label: page.title,
        url: page.route,
        order: page.footerOrder ?? 0,
        openInNewTab: false,
      },
    ].sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  return res.json(
    new ApiResponse(200, { ...plain, sections }, "Public footer fetched successfully"),
  );
});


module.exports = {
  getFooter,
    getPublicFooter,
  updateFooter,
  uploadLogo,
  removeLogo,
  resetFooter,
};
