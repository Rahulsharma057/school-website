const mongoose = require("mongoose");

const ContactPage = require("../models/ContactPage");
const Form = require("../models/Form");

const asyncHandler = require("../helpers/asyncHandler");
const ApiResponse = require("../helpers/ApiResponse");
const ApiError = require("../helpers/ApiError");

const slugify = (text = "") =>
  text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "");

const VALID_ROLES = ["SUPER_ADMIN", "ADMIN", "EDITOR", "VIEWER"];
const VALID_PLATFORMS = [
  "facebook",
  "instagram",
  "twitter",
  "youtube",
  "linkedin",
  "whatsapp",
  "telegram",
  "pinterest",
];

const withId = (item) => ({ ...item, id: item.id || new mongoose.Types.ObjectId().toString() });

const validateAddresses = (addresses = []) =>
  addresses.map((a) => {
    if (!a.label?.trim()) throw new ApiError(400, "Every address needs a label");
    if (!a.addressLine?.trim()) throw new ApiError(400, `Address "${a.label}" needs an address line`);
    return withId({ ...a, showOnPage: a.showOnPage !== false });
  });

const validatePhones = (phones = []) =>
  phones.map((p) => {
    if (!p.label?.trim()) throw new ApiError(400, "Every phone needs a label");
    if (!p.number?.trim()) throw new ApiError(400, `Phone "${p.label}" needs a number`);
    return withId({
      ...p,
      enableCall: p.enableCall !== false,
      enableWhatsapp: p.enableWhatsapp !== false,
    });
  });

const validateEmails = (emails = []) =>
  emails.map((e) => {
    if (!e.label?.trim()) throw new ApiError(400, "Every email needs a label");
    if (!e.address?.trim()) throw new ApiError(400, `Email "${e.label}" needs an address`);
    return withId(e);
  });

const validateSocialLinks = (links = []) =>
  links.map((l) => {
    if (!VALID_PLATFORMS.includes(l.platform)) {
      throw new ApiError(400, `Invalid social platform: ${l.platform}`);
    }
    if (!l.url?.trim()) throw new ApiError(400, `A URL is required for ${l.platform}`);
    return withId(l);
  });

const validateAccessControl = (accessControl) => {
  if (!accessControl) return { viewRoles: [] };
  const { viewRoles = [] } = accessControl;
  for (const role of viewRoles) {
    if (!VALID_ROLES.includes(role)) throw new ApiError(400, `Invalid role: ${role}`);
  }
  return { viewRoles };
};

const resolveContactForm = async (contactFormId) => {
  if (!contactFormId) return { contactFormId: null, contactFormSlug: "" };

  if (!mongoose.Types.ObjectId.isValid(contactFormId)) {
    throw new ApiError(400, "Invalid contactFormId");
  }

  const form = await Form.findById(contactFormId).lean();
  if (!form) throw new ApiError(404, "Selected contact form not found");

  return { contactFormId, contactFormSlug: form.slug };
};

// ================= CREATE =================

const createContactPage = asyncHandler(async (req, res) => {
  const {
    title,
    subtitle,
    slug,
    addresses,
    phones,
    emails,
    socialLinks,
    contactFormId,
    layout,
    status,
    accessControl,
  } = req.body;

  if (!title?.trim()) throw new ApiError(400, "Title is required");

  const finalSlug = slugify(slug || title);

  const exists = await ContactPage.findOne({ slug: finalSlug }).lean();
  if (exists) throw new ApiError(400, "A contact page with this route already exists");

  const { contactFormId: formId, contactFormSlug } = await resolveContactForm(contactFormId);

  const contactPage = await ContactPage.create({
    title,
    subtitle: subtitle || "",
    slug: finalSlug,
    addresses: validateAddresses(addresses),
    phones: validatePhones(phones),
    emails: validateEmails(emails),
    socialLinks: validateSocialLinks(socialLinks),
    contactFormId: formId,
    contactFormSlug,
    layout: {
      style: layout?.style === "stacked" ? "stacked" : "split",
      primaryColor: layout?.primaryColor || "#18181b",
    },
    status: status !== undefined ? status : true,
    accessControl: validateAccessControl(accessControl),
  });

  return res.status(201).json(new ApiResponse(201, contactPage, "Contact page created successfully"));
});

// ================= LIST (admin) =================

const getContactPages = asyncHandler(async (req, res) => {
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 10);
  const { search } = req.query;

  const filter = search
    ? { $or: [{ title: { $regex: search, $options: "i" } }, { slug: { $regex: search, $options: "i" } }] }
    : {};

  const total = await ContactPage.countDocuments(filter);

  const data = await ContactPage.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  return res.json(
    new ApiResponse(200, { data, total, page, limit, totalPages: Math.ceil(total / limit) }, "Contact pages fetched successfully"),
  );
});

// ================= GET ONE (admin, for edit) =================

const getContactPage = asyncHandler(async (req, res) => {
  const contactPage = await ContactPage.findById(req.params.id);
  if (!contactPage) throw new ApiError(404, "Contact page not found");
  return res.json(new ApiResponse(200, contactPage, "Contact page fetched successfully"));
});

// ================= PUBLIC (by slug) =================

const getPublicContactPage = asyncHandler(async (req, res) => {
  return res.json(new ApiResponse(200, req.resourceDoc, "Contact page fetched successfully"));
});

// ================= UPDATE =================

const updateContactPage = asyncHandler(async (req, res) => {
  const contactPage = await ContactPage.findById(req.params.id);
  if (!contactPage) throw new ApiError(404, "Contact page not found");

  const {
    title,
    subtitle,
    slug,
    addresses,
    phones,
    emails,
    socialLinks,
    contactFormId,
    layout,
    status,
    accessControl,
  } = req.body;

  if (title !== undefined) contactPage.title = title;
  if (subtitle !== undefined) contactPage.subtitle = subtitle;
  if (addresses !== undefined) contactPage.addresses = validateAddresses(addresses);
  if (phones !== undefined) contactPage.phones = validatePhones(phones);
  if (emails !== undefined) contactPage.emails = validateEmails(emails);
  if (socialLinks !== undefined) contactPage.socialLinks = validateSocialLinks(socialLinks);
  if (status !== undefined) contactPage.status = status;
  if (accessControl !== undefined) contactPage.accessControl = validateAccessControl(accessControl);

  if (layout !== undefined) {
    contactPage.layout = {
      style: layout.style === "stacked" ? "stacked" : "split",
      primaryColor: layout.primaryColor || contactPage.layout?.primaryColor || "#18181b",
    };
  }

  if (contactFormId !== undefined) {
    const { contactFormId: formId, contactFormSlug } = await resolveContactForm(contactFormId);
    contactPage.contactFormId = formId;
    contactPage.contactFormSlug = contactFormSlug;
  }

  const finalSlug = slugify(slug || contactPage.slug);

  if (finalSlug !== contactPage.slug) {
    const duplicate = await ContactPage.findOne({ slug: finalSlug, _id: { $ne: contactPage._id } }).lean();
    if (duplicate) throw new ApiError(400, "A contact page with this route already exists");
    contactPage.slug = finalSlug;
  }

  await contactPage.save();

  return res.json(new ApiResponse(200, contactPage, "Contact page updated successfully"));
});

// ================= DELETE =================

const deleteContactPage = asyncHandler(async (req, res) => {
  const contactPage = await ContactPage.findById(req.params.id);
  if (!contactPage) throw new ApiError(404, "Contact page not found");

  await contactPage.deleteOne();

  return res.json(new ApiResponse(200, null, "Contact page deleted successfully"));
});

module.exports = {
  createContactPage,
  getContactPages,
  getContactPage,
  getPublicContactPage,
  updateContactPage,
  deleteContactPage,
};