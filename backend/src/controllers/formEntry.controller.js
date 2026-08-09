const mongoose = require("mongoose");
const crypto = require("crypto");

const Form = require("../models/Form");
const FormEntry = require("../models/FormEntry");

const uploadToCloudinary = require("../utils/uploadToCloudinary");
const deleteFromCloudinary = require("../utils/deleteFromCloudinary");
const sendMail = require("../utils/sendMail");
const sendWebhook = require("../utils/sendWebhook");

const asyncHandler = require("../helpers/asyncHandler");
const ApiResponse = require("../helpers/ApiResponse");
const ApiError = require("../helpers/ApiError");

// Constant, well-known hidden field name the frontend injects when a
// form has honeypotEnabled — a real user never sees or fills this;
// a bot's autofill script usually does.
const HONEYPOT_FIELD_NAME = "_hpw";

const parseJson = (value, fallback) => {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const detectDeviceType = (userAgent = "") => {
  const ua = userAgent.toLowerCase();
  if (/tablet|ipad/.test(ua)) return "tablet";
  if (/mobi|android|iphone/.test(ua)) return "mobile";
  if (ua) return "desktop";
  return "unknown";
};

const extractSubmitterInfo = (data = {}) => {
  const pick = (...keys) => {
    for (const key of keys) {
      if (data[key]) return String(data[key]).trim();
    }
    return "";
  };

  return {
    submitterName: pick("fullName", "name", "fullname", "studentName"),
    submitterEmail: pick("email", "emailAddress", "parentEmail"),
    submitterPhone: pick("phone", "phoneNumber", "mobile", "contactNumber"),
  };
};

const buildColumnsFromForm = (form) =>
  (form.fields || [])
    .filter((f) => f.type !== "section" && f.showInTable !== false)
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .map((f) => ({
      key: f.name,
      label: f.label,
      dataType: f.dataType,
      type: f.type,
    }));

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ALLOWED_STATUSES = ["pending", "approved", "rejected", "archived"];

const escapeRegex = (str = "") => String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const parseStatusFilter = (status) => {
  if (!status) return undefined;
  if (typeof status !== "string" || !ALLOWED_STATUSES.includes(status)) {
    throw new ApiError(400, `status must be one of: ${ALLOWED_STATUSES.join(", ")}`);
  }
  return status;
};

const parseDateFilter = (value, label) => {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new ApiError(400, `Invalid ${label}`);
  }
  return date;
};

// FIX: evaluates ONE conditional rule.
const evaluateRule = (rule, values) => {
  const watchedValue = values?.[rule.fieldName];
  const target = rule.value ?? "";

  if (rule.operator === "contains") {
    const arr = Array.isArray(watchedValue) ? watchedValue : [watchedValue];
    return arr.map((v) => String(v)).includes(target);
  }

  const asString = watchedValue === undefined || watchedValue === null ? "" : String(watchedValue);
  if (rule.operator === "notEquals") return asString !== target;
  return asString === target;
};

// FIX: a field's visibility is now the AND/OR combination of ALL its
// rules — mirrors exactly what FormRenderer/FormEditRenderer compute
// client-side, so a hidden field is never required, validated, or
// stored on either the client or server.
const isFieldVisible = (field, rawData) => {
  if (!field.conditional?.enabled || !field.conditional?.rules?.length) return true;

  const results = field.conditional.rules.map((rule) => evaluateRule(rule, rawData));
  return field.conditional.logic === "OR" ? results.some(Boolean) : results.every(Boolean);
};

const validateEntryData = (form, rawData, filesByField) => {
  const cleanData = {};
  const errors = [];

  for (const field of form.fields) {
    // Section headings are visual-only — never validated, never stored.
    if (field.type === "section") continue;

    if (!isFieldVisible(field, rawData)) continue;

    // FIX: a field can be required unconditionally (`field.required`) OR
    // only while its condition is true (`requiredWhenVisible`) — since
    // we already know it's visible at this point, requiredWhenVisible
    // effectively forces required=true here.
    const effectiveRequired = field.conditional?.enabled && field.conditional?.requiredWhenVisible ? true : field.required;

    const raw = rawData[field.name];
    const isEmpty = raw === undefined || raw === null || raw === "" || (Array.isArray(raw) && raw.length === 0);

    if (field.type === "file") {
      const uploaded = filesByField[field.name] || [];

      if (effectiveRequired && uploaded.length === 0) {
        errors.push(`"${field.label}" is required`);
        continue;
      }

      if (uploaded.length > (field.maxFiles || 1)) {
        errors.push(`"${field.label}" allows at most ${field.maxFiles || 1} file(s)`);
        continue;
      }

      for (const file of uploaded) {
        if (!file || file.mimetype === undefined) continue;

        const allowedTypes = field.accept?.length ? field.accept : [];
        if (allowedTypes.length && !allowedTypes.includes(file.mimetype)) {
          errors.push(`"${field.label}" only accepts: ${allowedTypes.join(", ")} (got ${file.mimetype})`);
        }

        const maxBytes = (field.maxFileSizeMB || 5) * 1024 * 1024;
        if (file.size > maxBytes) {
          errors.push(`"${field.label}" file exceeds ${field.maxFileSizeMB || 5}MB`);
        }
      }

      continue;
    }

    if (effectiveRequired && isEmpty) {
      errors.push(`"${field.label}" is required`);
      continue;
    }

    if (isEmpty) continue;

    switch (field.dataType) {
      case "String": {
        const str = String(raw).trim();

        if (field.type === "email" && !EMAIL_REGEX.test(str)) {
          errors.push(`"${field.label}" must be a valid email`);
          break;
        }
        if (field.minLength && str.length < field.minLength) {
          errors.push(`"${field.label}" must be at least ${field.minLength} characters`);
          break;
        }
        if (field.maxLength && str.length > field.maxLength) {
          errors.push(`"${field.label}" must be at most ${field.maxLength} characters`);
          break;
        }
        if (["select", "radio"].includes(field.type) && field.options?.length) {
          if (!field.options.includes(str)) {
            errors.push(`"${field.label}" must be one of the allowed options`);
            break;
          }
        }
        cleanData[field.name] = str;
        break;
      }

      case "Number": {
        const num = Number(raw);
        if (Number.isNaN(num)) {
          errors.push(`"${field.label}" must be a number`);
          break;
        }
        if (field.min !== null && field.min !== undefined && num < field.min) {
          errors.push(`"${field.label}" must be at least ${field.min}`);
          break;
        }
        if (field.max !== null && field.max !== undefined && num > field.max) {
          errors.push(`"${field.label}" must be at most ${field.max}`);
          break;
        }
        cleanData[field.name] = num;
        break;
      }

      case "Boolean": {
        cleanData[field.name] = raw === true || raw === "true";
        break;
      }

      case "Date": {
        const date = new Date(raw);
        if (Number.isNaN(date.getTime())) {
          errors.push(`"${field.label}" must be a valid date`);
          break;
        }
        cleanData[field.name] = date;
        break;
      }

      case "Array": {
        const arr = Array.isArray(raw) ? raw : [raw];
        if (field.type === "checkbox" && field.options?.length) {
          const invalid = arr.filter((v) => !field.options.includes(v));
          if (invalid.length) {
            errors.push(`"${field.label}" has invalid option(s): ${invalid.join(", ")}`);
            break;
          }
        }
        cleanData[field.name] = arr;
        break;
      }

      default:
        cleanData[field.name] = raw;
    }
  }

  if (errors.length) {
    throw new ApiError(400, errors.join("; "));
  }

  return cleanData;
};

// FIX: best-effort notifications, fired after the entry is safely saved.
// Never throws, never awaited by the response — a broken SMTP config or
// dead webhook endpoint must never fail or delay the visitor's submission.
const sendSubmissionNotifications = async ({ form, entry, cleanData }) => {
  const tasks = [];

  if (form.notifyEmail) {
    tasks.push(
      sendMail({
        to: form.notifyEmail,
        subject: `New submission: ${form.title}`,
        html: `<p>A new response was submitted to "<b>${form.title}</b>".</p><p>Submitter: ${
          entry.submitterName || entry.submitterEmail || entry.submitterPhone || "(no contact info)"
        }</p>`,
      }),
    );
  }

  if (form.submission?.autoResponder?.enabled && entry.submitterEmail) {
    const subject = form.submission.autoResponder.subject || "We received your submission";
    const message = (form.submission.autoResponder.message || "Thanks for submitting {{formTitle}}. We'll be in touch soon.")
      .replace(/{{\s*formTitle\s*}}/gi, form.title)
      .replace(/{{\s*name\s*}}/gi, entry.submitterName || "");

    tasks.push(sendMail({ to: entry.submitterEmail, subject, html: `<p>${message}</p>` }));
  }

  if (form.notifications?.webhookEnabled && form.notifications?.webhookUrl) {
    tasks.push(
      sendWebhook(form.notifications.webhookUrl, {
        text: `New submission on "${form.title}" from ${entry.submitterName || entry.submitterEmail || "a visitor"}`,
        formTitle: form.title,
        formSlug: form.slug,
        entryId: entry._id,
        submitterName: entry.submitterName,
        submitterEmail: entry.submitterEmail,
        submitterPhone: entry.submitterPhone,
        data: cleanData,
        submittedAt: entry.createdAt,
      }),
    );
  }

  await Promise.allSettled(tasks);
};

// ================= CREATE (public — a visitor submitting the form) =================

const submitEntry = asyncHandler(async (req, res) => {
  const { formId, source } = req.body;

  if (!formId || !mongoose.Types.ObjectId.isValid(formId)) {
    throw new ApiError(400, "A valid formId is required");
  }

  const form = await Form.findById(formId).lean();

  if (!form || form.status !== true) {
    throw new ApiError(404, "Form not found or is not accepting submissions");
  }

  const viewRoles = form.accessControl?.viewRoles || [];
  if (viewRoles.length) {
    const userRole = req.user?.role;
    if (!userRole || !viewRoles.includes(userRole)) {
      throw new ApiError(403, "You are not allowed to submit this form");
    }
  }

  // FIX: honeypot check — a real visitor never sees or fills this field
  // (hidden via CSS in the renderer); if it has a value, this is almost
  // certainly a bot. Respond exactly like a normal success so the bot
  // doesn't learn its submission was rejected, but never actually save
  // anything.
  if (form.antiSpam?.honeypotEnabled !== false && req.body[HONEYPOT_FIELD_NAME]) {
    return res.status(201).json(new ApiResponse(201, { _id: null, editToken: null }, "Form submitted successfully"));
  }

  const rawData = parseJson(req.body.data, {});

  if (!rawData || typeof rawData !== "object" || Array.isArray(rawData)) {
    throw new ApiError(400, "Submitted data must be an object");
  }

  const filesByField = {};
  for (const file of req.files || []) {
    if (!filesByField[file.fieldname]) filesByField[file.fieldname] = [];
    filesByField[file.fieldname].push(file);
  }

  const cleanData = validateEntryData(form, rawData, filesByField);

  const { submitterName, submitterEmail, submitterPhone } = extractSubmitterInfo(cleanData);

  // FIX: duplicate-submission guard — blocks the same submitter (by
  // email or phone) from submitting this same form again within the
  // configured window, before any files are uploaded.
  if (form.antiSpam?.duplicateCheck?.enabled && (submitterEmail || submitterPhone)) {
    const windowHours = form.antiSpam.duplicateCheck.windowHours || 24;
    const since = new Date(Date.now() - windowHours * 60 * 60 * 1000);

    const dupOr = [];
    if (submitterEmail) dupOr.push({ submitterEmail });
    if (submitterPhone) dupOr.push({ submitterPhone });

    const isDuplicate = await FormEntry.exists({
      formId: form._id,
      isDeleted: false,
      createdAt: { $gte: since },
      $or: dupOr,
    });

    if (isDuplicate) {
      throw new ApiError(429, "You've already submitted this form recently. Please try again later.");
    }
  }

  const fileFieldNames = new Set(form.fields.filter((f) => f.type === "file").map((f) => f.name));
  const filesToUpload = (req.files || []).filter((f) => fileFieldNames.has(f.fieldname));

  const uploadedFiles = [];

  try {
    for (const file of filesToUpload) {
      const uploaded = await uploadToCloudinary(file, {
        folder: `school-website/form-entries/${form.slug}`,
        resourceType: "auto",
      });

      uploadedFiles.push({
        fieldName: file.fieldname,
        url: uploaded.url,
        public_id: uploaded.public_id,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
      });
    }

    let editToken = null;
    let editTokenExpiresAt = null;

    if (form.submission?.allowSubmitterEdit) {
      editToken = crypto.randomBytes(24).toString("hex");
      editTokenExpiresAt = form.submission.editWindowHours
        ? new Date(Date.now() + form.submission.editWindowHours * 60 * 60 * 1000)
        : null;
    }

    const entry = await FormEntry.create({
      formId: form._id,
      formTitle: form.title,
      formSlug: form.slug,
      data: cleanData,
      files: uploadedFiles,
      submitterName,
      submitterEmail,
      submitterPhone,
      submittedBy: req.user?._id || null,
      source: source || "route",
      ip: req.ip || req.headers["x-forwarded-for"] || "",
      userAgent: req.headers["user-agent"] || "",
      deviceType: detectDeviceType(req.headers["user-agent"]),
      editToken,
      editTokenExpiresAt,
    });

    Form.updateOne({ _id: form._id }, { $inc: { entryCount: 1 } }).catch(() => {});

    // Fire-and-forget — never blocks the response.
    sendSubmissionNotifications({ form, entry, cleanData }).catch(() => {});

    return res.status(201).json(new ApiResponse(201, entry, "Form submitted successfully"));
  } catch (err) {
    await Promise.all(uploadedFiles.map((f) => deleteFromCloudinary(f.public_id).catch(() => {})));
    throw err;
  }
});

// ================= LIST (admin) =================

const getEntries = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(Math.max(1, Number(req.query.limit) || 10), 100);

  const { formId, status, search, dateFrom, dateTo, includeDeleted } = req.query;

  const filter = {};

  if (!includeDeleted || includeDeleted === "false") {
    filter.isDeleted = false;
  }

  if (formId) {
    if (!mongoose.Types.ObjectId.isValid(formId)) {
      throw new ApiError(400, "Invalid formId");
    }
    filter.formId = formId;
  }

  const statusFilter = parseStatusFilter(status);
  if (statusFilter) filter.status = statusFilter;

  const gte = parseDateFilter(dateFrom, "dateFrom");
  const lte = parseDateFilter(dateTo, "dateTo");
  if (gte || lte) {
    filter.createdAt = {};
    if (gte) filter.createdAt.$gte = gte;
    if (lte) filter.createdAt.$lte = lte;
  }

  if (search && typeof search === "string") {
    const safeSearch = escapeRegex(search);
    filter.$or = [
      { formTitle: { $regex: safeSearch, $options: "i" } },
      { submitterName: { $regex: safeSearch, $options: "i" } },
      { submitterEmail: { $regex: safeSearch, $options: "i" } },
      { submitterPhone: { $regex: safeSearch, $options: "i" } },
    ];
  }

  const [total, data] = await Promise.all([
    FormEntry.countDocuments(filter),
    FormEntry.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
  ]);

  return res.json(
    new ApiResponse(200, { data, total, page, limit, totalPages: Math.ceil(total / limit) }, "Entries fetched successfully"),
  );
});

// ================= LIST BY TABLE ROUTE =================

const getEntriesByTableSlug = asyncHandler(async (req, res) => {
  const form = req.formDoc;

  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(Math.max(1, Number(req.query.limit) || 10), 100);

  const { status, search, dateFrom, dateTo, includeDeleted } = req.query;

  const filter = { formId: form._id };

  if (!includeDeleted || includeDeleted === "false") {
    filter.isDeleted = false;
  }

  const statusFilter = parseStatusFilter(status);
  if (statusFilter) filter.status = statusFilter;

  const gte = parseDateFilter(dateFrom, "dateFrom");
  const lte = parseDateFilter(dateTo, "dateTo");
  if (gte || lte) {
    filter.createdAt = {};
    if (gte) filter.createdAt.$gte = gte;
    if (lte) filter.createdAt.$lte = lte;
  }

  if (search && typeof search === "string") {
    const safeSearch = escapeRegex(search);
    filter.$or = [
      { submitterName: { $regex: safeSearch, $options: "i" } },
      { submitterEmail: { $regex: safeSearch, $options: "i" } },
      { submitterPhone: { $regex: safeSearch, $options: "i" } },
    ];
  }

  const [total, data] = await Promise.all([
    FormEntry.countDocuments(filter),
    FormEntry.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
  ]);

  return res.json(
    new ApiResponse(
      200,
      {
        form: { _id: form._id, title: form.title, slug: form.slug, adminTableSlug: form.adminTableSlug },
        columns: buildColumnsFromForm(form),
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      "Entries fetched successfully",
    ),
  );
});

// ================= GET ONE =================

const getEntry = asyncHandler(async (req, res) => {
  const entry = await FormEntry.findById(req.params.id);
  if (!entry) throw new ApiError(404, "Entry not found");
  return res.json(new ApiResponse(200, entry, "Entry fetched successfully"));
});

// ================= PUBLIC — FETCH FOR SELF-SERVICE EDIT (by token) =================

const getEntryByEditToken = asyncHandler(async (req, res) => {
  const { token } = req.params;

  const entry = await FormEntry.findOne({ editToken: token }).lean();
  if (!entry) throw new ApiError(404, "Invalid or expired edit link");

  if (entry.editTokenExpiresAt && new Date(entry.editTokenExpiresAt) < new Date()) {
    throw new ApiError(410, "This edit link has expired");
  }

  const form = await Form.findById(entry.formId).lean();
  if (!form) throw new ApiError(404, "The form for this submission no longer exists");

  if (!form.submission?.allowSubmitterEdit) {
    throw new ApiError(403, "Editing is no longer allowed for this form");
  }

  return res.json(new ApiResponse(200, { entry, form }, "Entry fetched successfully"));
});

// ================= PUBLIC — SELF-SERVICE UPDATE (by token) =================

const updateEntryByEditToken = asyncHandler(async (req, res) => {
  const { token } = req.params;

  const entry = await FormEntry.findOne({ editToken: token });
  if (!entry) throw new ApiError(404, "Invalid or expired edit link");

  if (entry.editTokenExpiresAt && new Date(entry.editTokenExpiresAt) < new Date()) {
    throw new ApiError(410, "This edit link has expired");
  }

  const form = await Form.findById(entry.formId).lean();
  if (!form || !form.submission?.allowSubmitterEdit) {
    throw new ApiError(403, "Editing is no longer allowed for this form");
  }

  const rawData = parseJson(req.body.data, {});
  if (!rawData || typeof rawData !== "object" || Array.isArray(rawData)) {
    throw new ApiError(400, "Submitted data must be an object");
  }

  const existingFilesByField = {};
  for (const f of entry.files || []) {
    if (!existingFilesByField[f.fieldName]) existingFilesByField[f.fieldName] = [];
    existingFilesByField[f.fieldName].push(f);
  }

  const incomingFiles = req.files || [];
  const newFilesByField = {};
  for (const file of incomingFiles) {
    if (!newFilesByField[file.fieldname]) newFilesByField[file.fieldname] = [];
    newFilesByField[file.fieldname].push(file);
  }

  const combinedFilesByField = { ...existingFilesByField, ...newFilesByField };

  const cleanData = validateEntryData(form, rawData, combinedFilesByField);

  const uploadedFiles = [];

  try {
    if (incomingFiles.length) {
      const fileFieldNames = new Set(form.fields.filter((f) => f.type === "file").map((f) => f.name));
      const filesToUpload = incomingFiles.filter((f) => fileFieldNames.has(f.fieldname));

      for (const file of filesToUpload) {
        const uploaded = await uploadToCloudinary(file, {
          folder: `school-website/form-entries/${form.slug}`,
          resourceType: "auto",
        });

        uploadedFiles.push({
          fieldName: file.fieldname,
          url: uploaded.url,
          public_id: uploaded.public_id,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
        });
      }

      if (uploadedFiles.length) {
        const replacedFieldNames = new Set(uploadedFiles.map((f) => f.fieldName));
        const toDelete = (entry.files || []).filter((f) => replacedFieldNames.has(f.fieldName));
        await Promise.all(toDelete.map((f) => deleteFromCloudinary(f.public_id).catch(() => {})));

        entry.files = [...(entry.files || []).filter((f) => !replacedFieldNames.has(f.fieldName)), ...uploadedFiles];
      }
    }

    entry.data = cleanData;

    const { submitterName, submitterEmail, submitterPhone } = extractSubmitterInfo(cleanData);
    entry.submitterName = submitterName || entry.submitterName;
    entry.submitterEmail = submitterEmail || entry.submitterEmail;
    entry.submitterPhone = submitterPhone || entry.submitterPhone;

    await entry.save();
  } catch (err) {
    await Promise.all(uploadedFiles.map((f) => deleteFromCloudinary(f.public_id).catch(() => {})));
    throw err;
  }

  return res.json(new ApiResponse(200, entry, "Your response has been updated"));
});

// ================= UPDATE (admin) =================

const updateEntry = asyncHandler(async (req, res) => {
  const entry = await FormEntry.findById(req.params.id);
  if (!entry) throw new ApiError(404, "Entry not found");

  const hasDataUpdate = req.body.data !== undefined;
  const incomingFiles = req.files || [];
  const hasFileUpdate = incomingFiles.length > 0;

  if (!hasDataUpdate && !hasFileUpdate) {
    return res.json(new ApiResponse(200, entry, "Nothing to update"));
  }

  const form = await Form.findById(entry.formId).lean();

  const rawData = hasDataUpdate ? parseJson(req.body.data, entry.data) : entry.data;

  if (hasDataUpdate && (!rawData || typeof rawData !== "object" || Array.isArray(rawData))) {
    throw new ApiError(400, "Submitted data must be an object");
  }

  const existingFilesByField = {};
  for (const f of entry.files || []) {
    if (!existingFilesByField[f.fieldName]) existingFilesByField[f.fieldName] = [];
    existingFilesByField[f.fieldName].push(f);
  }

  const newFilesByField = {};
  for (const file of incomingFiles) {
    if (!newFilesByField[file.fieldname]) newFilesByField[file.fieldname] = [];
    newFilesByField[file.fieldname].push(file);
  }

  const combinedFilesByField = { ...existingFilesByField, ...newFilesByField };

  const cleanData = form ? validateEntryData(form, rawData, combinedFilesByField) : rawData;

  const uploadedFiles = [];

  try {
    if (hasFileUpdate && form) {
      const fileFieldNames = new Set(form.fields.filter((f) => f.type === "file").map((f) => f.name));
      const filesToUpload = incomingFiles.filter((f) => fileFieldNames.has(f.fieldname));

      for (const file of filesToUpload) {
        const uploaded = await uploadToCloudinary(file, {
          folder: `school-website/form-entries/${form.slug}`,
          resourceType: "auto",
        });

        uploadedFiles.push({
          fieldName: file.fieldname,
          url: uploaded.url,
          public_id: uploaded.public_id,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
        });
      }

      if (uploadedFiles.length) {
        const replacedFieldNames = new Set(uploadedFiles.map((f) => f.fieldName));
        const toDelete = (entry.files || []).filter((f) => replacedFieldNames.has(f.fieldName));
        await Promise.all(toDelete.map((f) => deleteFromCloudinary(f.public_id).catch(() => {})));

        entry.files = [...(entry.files || []).filter((f) => !replacedFieldNames.has(f.fieldName)), ...uploadedFiles];
      }
    }

    if (hasDataUpdate) {
      entry.data = cleanData;

      const { submitterName, submitterEmail, submitterPhone } = extractSubmitterInfo(cleanData);
      entry.submitterName = submitterName || entry.submitterName;
      entry.submitterEmail = submitterEmail || entry.submitterEmail;
      entry.submitterPhone = submitterPhone || entry.submitterPhone;
    }

    await entry.save();
  } catch (err) {
    await Promise.all(uploadedFiles.map((f) => deleteFromCloudinary(f.public_id).catch(() => {})));
    throw err;
  }

  return res.json(new ApiResponse(200, entry, "Entry updated successfully"));
});

// ================= REVIEW =================

const updateEntryStatus = asyncHandler(async (req, res) => {
  const { status, note } = req.body;

  if (!ALLOWED_STATUSES.includes(status)) {
    throw new ApiError(400, `status must be one of: ${ALLOWED_STATUSES.join(", ")}`);
  }

  const entry = await FormEntry.findById(req.params.id);
  if (!entry) throw new ApiError(404, "Entry not found");

  entry.status = status;
  entry.reviewNote = note || "";
  entry.reviewedBy = req.user?._id || null;
  entry.reviewedAt = new Date();

  await entry.save();

  return res.json(new ApiResponse(200, entry, `Entry marked as ${status}`));
});

// ================= SOFT DELETE =================

const deleteEntry = asyncHandler(async (req, res) => {
  const entry = await FormEntry.findById(req.params.id);
  if (!entry) throw new ApiError(404, "Entry not found");

  entry.isDeleted = true;
  entry.deletedAt = new Date();
  await entry.save();

  return res.json(new ApiResponse(200, entry, "Entry moved to trash"));
});

// ================= RESTORE =================

const restoreEntry = asyncHandler(async (req, res) => {
  const entry = await FormEntry.findById(req.params.id);
  if (!entry) throw new ApiError(404, "Entry not found");

  entry.isDeleted = false;
  entry.deletedAt = null;
  await entry.save();

  return res.json(new ApiResponse(200, entry, "Entry restored"));
});

// ================= PERMANENT DELETE =================

const permanentlyDeleteEntry = asyncHandler(async (req, res) => {
  const entry = await FormEntry.findById(req.params.id);
  if (!entry) throw new ApiError(404, "Entry not found");

  for (const file of entry.files || []) {
    if (file.public_id) await deleteFromCloudinary(file.public_id);
  }

  await entry.deleteOne();

  return res.json(new ApiResponse(200, null, "Entry permanently deleted"));
});

// ================= DUPLICATE =================

const duplicateEntry = asyncHandler(async (req, res) => {
  const source = await FormEntry.findById(req.params.id).lean();
  if (!source) throw new ApiError(404, "Entry not found");

  const { _id, createdAt, updatedAt, files, editToken, editTokenExpiresAt, ...rest } = source;

  const duplicate = await FormEntry.create({
    ...rest,
    files: [],
    status: "pending",
    reviewedBy: null,
    reviewNote: "",
    reviewedAt: null,
    isDeleted: false,
    deletedAt: null,
    editToken: null,
    editTokenExpiresAt: null,
  });

  return res.status(201).json(new ApiResponse(201, duplicate, "Entry duplicated successfully"));
});

// ================= BULK ACTIONS =================

const BULK_ACTIONS = ["approve", "reject", "archive", "delete", "restore", "permanentlyDelete"];
const MAX_BULK_IDS = 500;

const bulkAction = asyncHandler(async (req, res) => {
  const { ids, action, note } = req.body;

  if (!Array.isArray(ids) || !ids.length) {
    throw new ApiError(400, "ids must be a non-empty array");
  }

  if (ids.length > MAX_BULK_IDS) {
    throw new ApiError(400, `You can only act on up to ${MAX_BULK_IDS} entries at once`);
  }

  if (!BULK_ACTIONS.includes(action)) {
    throw new ApiError(400, `action must be one of: ${BULK_ACTIONS.join(", ")}`);
  }

  const invalidIds = ids.filter((id) => !mongoose.Types.ObjectId.isValid(id));
  if (invalidIds.length) {
    throw new ApiError(400, `Invalid id(s): ${invalidIds.join(", ")}`);
  }

  if (action === "permanentlyDelete") {
    const entries = await FormEntry.find({ _id: { $in: ids } });

    for (const entry of entries) {
      for (const file of entry.files || []) {
        if (file.public_id) await deleteFromCloudinary(file.public_id);
      }
    }

    await FormEntry.deleteMany({ _id: { $in: ids } });

    return res.json(new ApiResponse(200, { deletedCount: entries.length }, "Entries permanently deleted"));
  }

  const statusMap = { approve: "approved", reject: "rejected", archive: "archived" };

  let update;
  if (statusMap[action]) {
    update = {
      status: statusMap[action],
      reviewNote: note || "",
      reviewedBy: req.user?._id || null,
      reviewedAt: new Date(),
    };
  } else if (action === "delete") {
    update = { isDeleted: true, deletedAt: new Date() };
  } else if (action === "restore") {
    update = { isDeleted: false, deletedAt: null };
  }

  const result = await FormEntry.updateMany({ _id: { $in: ids } }, update);

  return res.json(
    new ApiResponse(200, { matchedCount: result.matchedCount, modifiedCount: result.modifiedCount }, `Bulk ${action} applied`),
  );
});

// ================= EXPORT (CSV) =================

const escapeCsv = (value) => {
  const str = value === undefined || value === null ? "" : String(value);
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
};

const exportEntriesCSV = asyncHandler(async (req, res) => {
  const { formId, status } = req.query;

  const filter = { isDeleted: false };

  if (formId) {
    if (!mongoose.Types.ObjectId.isValid(formId)) throw new ApiError(400, "Invalid formId");
    filter.formId = formId;
  }

  const statusFilter = parseStatusFilter(status);
  if (statusFilter) filter.status = statusFilter;

  const exists = await FormEntry.exists(filter);
  if (!exists) throw new ApiError(404, "No entries to export");

  const fixedColumns = ["_id", "formTitle", "status", "submitterName", "submitterEmail", "submitterPhone", "createdAt"];

  let dynamicKeys = [];

  if (formId) {
    const form = await Form.findById(formId).select("fields").lean();
    dynamicKeys = (form?.fields || []).filter((f) => f.type !== "section").map((f) => f.name);
  } else {
    const sample = await FormEntry.find(filter).select("data").limit(200).lean();
    const keySet = new Set();
    sample.forEach((e) => Object.keys(e.data || {}).forEach((k) => keySet.add(k)));
    dynamicKeys = Array.from(keySet);
  }

  const columns = [...fixedColumns, ...dynamicKeys];

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="form-entries-${Date.now()}.csv"`);

  res.write(columns.join(",") + "\n");

  const cursor = FormEntry.find(filter).sort({ createdAt: -1 }).lean().cursor();

  for await (const e of cursor) {
    const row = columns.map((col) => (fixedColumns.includes(col) ? escapeCsv(e[col]) : escapeCsv(e.data?.[col]))).join(",");
    res.write(row + "\n");
  }

  return res.end();
});

module.exports = {
  submitEntry,
  getEntries,
  getEntriesByTableSlug,
  getEntry,
  getEntryByEditToken,
  updateEntryByEditToken,
  updateEntry,
  updateEntryStatus,
  deleteEntry,
  restoreEntry,
  permanentlyDeleteEntry,
  duplicateEntry,
  bulkAction,
  exportEntriesCSV,
  HONEYPOT_FIELD_NAME,
};