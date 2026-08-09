const Form = require("../models/Form");
const { DEFAULT_IMAGE_MIME_TYPES, DEFAULT_MAX_FILE_SIZE_MB } = require("../models/Form");

const asyncHandler = require("../helpers/asyncHandler");
const ApiResponse = require("../helpers/ApiResponse");
const ApiError = require("../helpers/ApiError");

const slugify = (text = "") =>
  text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "");

const escapeRegex = (str = "") => String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const DEFAULT_DATATYPE_MAP = {
  text: "String",
  textarea: "String",
  email: "String",
  phone: "String",
  number: "Number",
  date: "Date",
  select: "String",
  radio: "String",
  checkbox: "Array",
  file: "String",
  section: "String",
};

const VALID_DATATYPES = ["String", "Number", "Boolean", "Date", "Array"];
const VALID_ROLES = ["SUPER_ADMIN", "ADMIN", "EDITOR", "VIEWER"];
const VALID_CONDITIONAL_OPERATORS = ["equals", "notEquals", "contains"];

const MAX_FIELDS_PER_FORM = 60;
const MAX_OPTIONS_PER_FIELD = 100;
const MAX_RULES_PER_FIELD = 10;
const HARD_MAX_LENGTH = 10_000;
const HARD_MAX_FILE_SIZE_MB = 25;
const HARD_MAX_FILES_PER_FIELD = 10;
const MAX_EDIT_WINDOW_HOURS = 24 * 365;
const MAX_DUPLICATE_WINDOW_HOURS = 24 * 30;

const FIELD_NAME_REGEX = /^[a-zA-Z][a-zA-Z0-9_]*$/;

const RESERVED_FIELD_NAMES = new Set([
  "_id",
  "id",
  "formId",
  "formTitle",
  "formSlug",
  "data",
  "files",
  "status",
  "submitterName",
  "submitterEmail",
  "submitterPhone",
  "submittedBy",
  "source",
  "ip",
  "userAgent",
  "deviceType",
  "reviewedBy",
  "reviewNote",
  "reviewedAt",
  "isDeleted",
  "deletedAt",
  "meta",
  "createdAt",
  "updatedAt",
]);

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

// Validates fields and returns a normalized copy — callers should use the
// RETURNED array, not the input one.
const validateAndNormalizeFields = (fields = []) => {
  if (!Array.isArray(fields) || !fields.length) {
    throw new ApiError(400, "Form must have at least one field");
  }

  if (fields.length > MAX_FIELDS_PER_FORM) {
    throw new ApiError(400, `A form can have at most ${MAX_FIELDS_PER_FORM} fields`);
  }

  const names = new Set();

  const normalized = fields.map((f) => {
    if (!f.label?.trim()) {
      throw new ApiError(400, "Every field needs a label");
    }

    if (!f.name?.trim()) {
      throw new ApiError(400, `Field "${f.label}" is missing a name key`);
    }

    const name = f.name.trim();

    if (!FIELD_NAME_REGEX.test(name)) {
      throw new ApiError(
        400,
        `Field "${f.label}" has an invalid name key ("${name}") — use only letters, numbers, and underscores, starting with a letter`,
      );
    }

    if (RESERVED_FIELD_NAMES.has(name)) {
      throw new ApiError(400, `Field "${f.label}" uses a reserved name key ("${name}") — please choose a different one`);
    }

    if (names.has(name)) {
      throw new ApiError(400, `Duplicate field name: "${name}"`);
    }

    names.add(name);

    let options;

    if (["select", "radio", "checkbox"].includes(f.type)) {
      const cleanOptions = (f.options || []).map((o) => o.trim()).filter(Boolean);

      if (!cleanOptions.length) {
        throw new ApiError(400, `Field "${f.label}" needs at least one option`);
      }
      if (cleanOptions.length > MAX_OPTIONS_PER_FIELD) {
        throw new ApiError(400, `Field "${f.label}" has too many options (max ${MAX_OPTIONS_PER_FIELD})`);
      }

      options = Array.from(new Set(cleanOptions));
    }

    const dataType = f.dataType || DEFAULT_DATATYPE_MAP[f.type] || "String";

    if (!VALID_DATATYPES.includes(dataType)) {
      throw new ApiError(400, `Field "${f.label}" has an invalid dataType: ${dataType}`);
    }

    const normalizedField = { ...f, name, dataType };
    if (options) normalizedField.options = options;

    if (["text", "textarea", "email", "phone"].includes(f.type)) {
      let maxLength = Number.isFinite(f.maxLength) ? f.maxLength : 500;
      maxLength = Math.min(Math.max(maxLength, 1), HARD_MAX_LENGTH);
      normalizedField.maxLength = maxLength;

      if (f.minLength !== undefined && f.minLength !== null) {
        const minLength = Math.max(0, Number(f.minLength) || 0);
        if (minLength > maxLength) {
          throw new ApiError(400, `Field "${f.label}" has minLength greater than maxLength`);
        }
        normalizedField.minLength = minLength;
      }
    }

    if (f.type === "number") {
      if (f.min !== undefined && f.min !== null && f.max !== undefined && f.max !== null) {
        if (Number(f.min) > Number(f.max)) {
          throw new ApiError(400, `Field "${f.label}" has min greater than max`);
        }
      }
    }

    if (f.type === "file") {
      const requestedAccept = Array.isArray(f.accept) && f.accept.length ? f.accept : DEFAULT_IMAGE_MIME_TYPES;
      const accept = requestedAccept.filter((m) => ALLOWED_MIME_TYPES.has(m));

      if (!accept.length) {
        throw new ApiError(
          400,
          `Field "${f.label}" has no allowed file types — choose from: ${Array.from(ALLOWED_MIME_TYPES).join(", ")}`,
        );
      }

      normalizedField.accept = accept;

      let maxFileSizeMB = Number.isFinite(f.maxFileSizeMB) ? f.maxFileSizeMB : DEFAULT_MAX_FILE_SIZE_MB;
      normalizedField.maxFileSizeMB = Math.min(Math.max(maxFileSizeMB, 1), HARD_MAX_FILE_SIZE_MB);

      let maxFiles = Number.isFinite(f.maxFiles) ? f.maxFiles : 1;
      normalizedField.maxFiles = Math.min(Math.max(maxFiles, 1), HARD_MAX_FILES_PER_FIELD);
    }

    // FIX: conditional is now a rule-SET (AND/OR) instead of a single
    // rule, plus a `requiredWhenVisible` flag. Everything here is
    // normalized/clamped so a half-formed client payload can never
    // reach the DB.
    const rawConditional = f.conditional || {};
    const enabled = rawConditional.enabled === true;

    let rules = [];
    if (enabled) {
      rules = (Array.isArray(rawConditional.rules) ? rawConditional.rules : [])
        .slice(0, MAX_RULES_PER_FIELD)
        .map((r) => ({
          fieldName: String(r?.fieldName || "").trim(),
          operator: VALID_CONDITIONAL_OPERATORS.includes(r?.operator) ? r.operator : "equals",
          value: String(r?.value ?? ""),
        }))
        .filter((r) => r.fieldName);
    }

    normalizedField.conditional = {
      enabled,
      logic: rawConditional.logic === "OR" ? "OR" : "AND",
      rules,
      requiredWhenVisible: enabled && rawConditional.requiredWhenVisible === true,
    };

    return normalizedField;
  });

  // Cross-field checks — done once every field's final `name` is known,
  // since a rule can legally reference a field defined earlier OR later.
  const allNames = new Set(normalized.map((f) => f.name));

  for (const f of normalized) {
    if (!f.conditional.enabled) continue;

    if (!f.conditional.rules.length) {
      throw new ApiError(400, `Field "${f.label}" has conditional logic enabled but no rules defined`);
    }

    for (const rule of f.conditional.rules) {
      if (rule.fieldName === f.name) {
        throw new ApiError(400, `Field "${f.label}" cannot conditionally depend on itself`);
      }
      if (!allNames.has(rule.fieldName)) {
        throw new ApiError(
          400,
          `Field "${f.label}" has a conditional rule referencing a field that doesn't exist ("${rule.fieldName}")`,
        );
      }
    }
  }

  return normalized;
};

const validateAccessControl = (accessControl) => {
  if (!accessControl) return { viewRoles: [], tableViewRoles: ["SUPER_ADMIN", "ADMIN", "EDITOR"] };

  const { viewRoles = [], tableViewRoles = [] } = accessControl;

  for (const role of [...viewRoles, ...tableViewRoles]) {
    if (!VALID_ROLES.includes(role)) {
      throw new ApiError(400, `Invalid role in accessControl: ${role}`);
    }
  }

  return { viewRoles, tableViewRoles };
};

const toBool = (value, fallback) => (value !== undefined ? value === true || value === "true" : Boolean(fallback));

const normalizeSubmissionSettings = (submission, fallback = {}) => {
  const src = submission || {};
  const autoSrc = src.autoResponder || {};
  const fallbackAuto = fallback.autoResponder || {};

  const rawEditWindow = src.editWindowHours ?? fallback.editWindowHours ?? 72;
  const editWindowHours = Number.isFinite(Number(rawEditWindow))
    ? Math.min(Math.max(0, Number(rawEditWindow)), MAX_EDIT_WINDOW_HOURS)
    : 72;

  const confirmationMessage =
    (src.confirmationMessage ?? fallback.confirmationMessage ?? "").trim() ||
    "Are you sure you want to submit this form?";

  return {
    requireConfirmation: toBool(src.requireConfirmation, fallback.requireConfirmation),
    confirmationMessage,
    allowSubmitterEdit: toBool(src.allowSubmitterEdit, fallback.allowSubmitterEdit),
    editWindowHours,
    autoResponder: {
      enabled: toBool(autoSrc.enabled, fallbackAuto.enabled),
      subject: String(autoSrc.subject ?? fallbackAuto.subject ?? "We received your submission").trim() || "We received your submission",
      message:
        String(autoSrc.message ?? fallbackAuto.message ?? "Thanks for submitting {{formTitle}}. We'll be in touch soon.").trim() ||
        "Thanks for submitting {{formTitle}}. We'll be in touch soon.",
    },
  };
};

const normalizeNotifications = (notifications, fallback = {}) => ({
  webhookEnabled: toBool(notifications?.webhookEnabled, fallback.webhookEnabled),
  webhookUrl: String(notifications?.webhookUrl ?? fallback.webhookUrl ?? "").trim(),
});

const normalizeAntiSpam = (antiSpam, fallback = {}) => {
  const src = antiSpam || {};
  const dupSrc = src.duplicateCheck || {};
  const fallbackDup = fallback.duplicateCheck || {};

  const rawWindow = dupSrc.windowHours ?? fallbackDup.windowHours ?? 24;
  const windowHours = Number.isFinite(Number(rawWindow))
    ? Math.min(Math.max(1, Number(rawWindow)), MAX_DUPLICATE_WINDOW_HOURS)
    : 24;

  return {
    honeypotEnabled: src.honeypotEnabled !== undefined ? toBool(src.honeypotEnabled, true) : fallback.honeypotEnabled !== undefined ? fallback.honeypotEnabled : true,
    duplicateCheck: {
      enabled: toBool(dupSrc.enabled, fallbackDup.enabled),
      windowHours,
    },
  };
};

const resolveUniqueSlug = async ({ raw, fallback, field, excludeId, label }) => {
  const finalSlug = slugify(raw || fallback);

  if (!finalSlug) {
    throw new ApiError(400, `Could not generate a valid ${label} from the given text — please include at least one letter or number`);
  }

  const query = { [field]: finalSlug };
  if (excludeId) query._id = { $ne: excludeId };

  const duplicate = await Form.findOne(query).lean();
  if (duplicate) {
    throw new ApiError(400, `A form with this ${label} already exists`);
  }

  return finalSlug;
};

const withDuplicateKeyHandling = async (fn, label) => {
  try {
    return await fn();
  } catch (err) {
    if (err?.code === 11000) {
      throw new ApiError(400, `A form with this ${label} already exists — please choose another`);
    }
    throw err;
  }
};

// ================= CREATE =================

const createForm = asyncHandler(async (req, res) => {
  const {
    title,
    slug,
    description,
    fields,
    submitButtonText,
    successMessage,
    notifyEmail,
    status,
    layout,
    adminTableSlug,
    accessControl,
    submission,
    notifications,
    antiSpam,
  } = req.body;

  if (!title?.trim()) {
    throw new ApiError(400, "Title is required");
  }

  const normalizedFields = validateAndNormalizeFields(fields);

  const finalSlug = await resolveUniqueSlug({ raw: slug, fallback: title, field: "slug", label: "slug" });
  const finalTableSlug = await resolveUniqueSlug({
    raw: adminTableSlug,
    fallback: finalSlug,
    field: "adminTableSlug",
    label: "table route",
  });

  const form = await withDuplicateKeyHandling(
    () =>
      Form.create({
        title,
        slug: finalSlug,
        description: description || "",
        fields: normalizedFields,
        submitButtonText: submitButtonText || "Submit",
        successMessage: successMessage || "Thank you! Your response has been submitted.",
        notifyEmail: notifyEmail || "",
        status: status !== undefined ? status : true,
        layout: {
          columns: layout?.columns === 2 ? 2 : 1,
          style: layout?.style || "card",
          primaryColor: layout?.primaryColor || "#18181b",
        },
        adminTableSlug: finalTableSlug,
        accessControl: validateAccessControl(accessControl),
        submission: normalizeSubmissionSettings(submission),
        notifications: normalizeNotifications(notifications),
        antiSpam: normalizeAntiSpam(antiSpam),
      }),
    "slug",
  );

  return res.status(201).json(new ApiResponse(201, form, "Form created successfully"));
});

// ================= LIST (admin) =================

const getForms = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(Math.max(1, Number(req.query.limit) || 10), 100);
  const search = req.query.search ? escapeRegex(req.query.search) : "";

  const filter = search
    ? {
        $or: [
          { title: { $regex: search, $options: "i" } },
          { slug: { $regex: search, $options: "i" } },
          { adminTableSlug: { $regex: search, $options: "i" } },
        ],
      }
    : {};

  const total = await Form.countDocuments(filter);

  const data = await Form.find(filter).select("-fields").sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean();

  return res.json(
    new ApiResponse(200, { data, total, page, limit, totalPages: Math.ceil(total / limit) }, "Forms fetched successfully"),
  );
});

// ================= GET ONE (admin, for edit) =================

const getForm = asyncHandler(async (req, res) => {
  const form = await Form.findById(req.params.id);
  if (!form) throw new ApiError(404, "Form not found");
  return res.json(new ApiResponse(200, form, "Form fetched successfully"));
});

// ================= PUBLIC =================

const getPublicForm = asyncHandler(async (req, res) => {
  return res.json(new ApiResponse(200, req.formDoc, "Form fetched successfully"));
});

// ================= BY TABLE SLUG =================

const getFormByTableSlug = asyncHandler(async (req, res) => {
  return res.json(new ApiResponse(200, req.formDoc, "Form fetched successfully"));
});

// ================= UPDATE =================

const updateForm = asyncHandler(async (req, res) => {
  const form = await Form.findById(req.params.id);
  if (!form) throw new ApiError(404, "Form not found");

  const {
    title,
    slug,
    description,
    fields,
    submitButtonText,
    successMessage,
    notifyEmail,
    status,
    layout,
    adminTableSlug,
    accessControl,
    submission,
    notifications,
    antiSpam,
  } = req.body;

  if (fields) {
    form.fields = validateAndNormalizeFields(fields);
  }

  if (title !== undefined) form.title = title;
  if (description !== undefined) form.description = description;
  if (submitButtonText !== undefined) form.submitButtonText = submitButtonText;
  if (successMessage !== undefined) form.successMessage = successMessage;
  if (notifyEmail !== undefined) form.notifyEmail = notifyEmail;
  if (status !== undefined) form.status = status;

  if (layout !== undefined) {
    form.layout = {
      columns: layout.columns === 2 ? 2 : 1,
      style: layout.style || form.layout?.style || "card",
      primaryColor: layout.primaryColor || form.layout?.primaryColor || "#18181b",
    };
  }

  if (accessControl !== undefined) {
    form.accessControl = validateAccessControl(accessControl);
  }

  if (submission !== undefined) {
    form.submission = normalizeSubmissionSettings(submission, form.submission);
  }

  if (notifications !== undefined) {
    form.notifications = normalizeNotifications(notifications, form.notifications);
  }

  if (antiSpam !== undefined) {
    form.antiSpam = normalizeAntiSpam(antiSpam, form.antiSpam);
  }

  if (slug !== undefined || title !== undefined) {
    const finalSlug = await resolveUniqueSlug({
      raw: slug,
      fallback: title || form.title,
      field: "slug",
      excludeId: form._id,
      label: "slug",
    });
    if (finalSlug !== form.slug) form.slug = finalSlug;
  }

  if (adminTableSlug !== undefined) {
    const finalTableSlug = await resolveUniqueSlug({
      raw: adminTableSlug,
      fallback: form.slug,
      field: "adminTableSlug",
      excludeId: form._id,
      label: "table route",
    });
    if (finalTableSlug !== form.adminTableSlug) form.adminTableSlug = finalTableSlug;
  }

  await withDuplicateKeyHandling(() => form.save(), "slug");

  return res.json(new ApiResponse(200, form, "Form updated successfully"));
});

// ================= DELETE =================

const deleteForm = asyncHandler(async (req, res) => {
  const form = await Form.findById(req.params.id);
  if (!form) throw new ApiError(404, "Form not found");
  await form.deleteOne();
  return res.json(new ApiResponse(200, null, "Form deleted successfully"));
});

module.exports = {
  createForm,
  getForms,
  getForm,
  getPublicForm,
  getFormByTableSlug,
  updateForm,
  deleteForm,
  ALLOWED_MIME_TYPES,
};