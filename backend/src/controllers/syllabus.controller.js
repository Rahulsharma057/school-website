const mongoose = require("mongoose");

const Syllabus = require("../models/Syllabus");
const SchoolClass = require("../models/SchoolClass");

const generateSyllabusPdf = require("../utils/generateSyllabusPdf");
const uploadBufferToCloudinary = require("../utils/uploadBufferToCloudinary");
const deleteRawFromCloudinary = require("../utils/deleteRawFromCloudinary");

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
const VALID_PLACEMENTS = [
  "homepage",
  "academics-page",
  "navbar-dropdown",
  "footer",
  "notice-board",
];

const validateAndNormalizeSubjects = (subjects = []) => {
  if (!Array.isArray(subjects) || !subjects.length) {
    throw new ApiError(400, "Syllabus must have at least one subject");
  }

  return subjects.map((subject) => {
    if (!subject.name?.trim()) {
      throw new ApiError(400, "Every subject needs a name");
    }

    const topics = (subject.topics || []).map((topic) => {
      if (!topic.title?.trim()) {
        throw new ApiError(400, `A topic under "${subject.name}" is missing a title`);
      }
      return {
        id: topic.id || new mongoose.Types.ObjectId().toString(),
        title: topic.title,
        description: topic.description || "",
      };
    });

    return {
      id: subject.id || new mongoose.Types.ObjectId().toString(),
      name: subject.name,
      order: subject.order || 0,
      topics,
    };
  });
};

const validateAccessControl = (accessControl) => {
  if (!accessControl) return { viewRoles: [] };

  const { viewRoles = [] } = accessControl;

  for (const role of viewRoles) {
    if (!VALID_ROLES.includes(role)) {
      throw new ApiError(400, `Invalid role in accessControl: ${role}`);
    }
  }

  return { viewRoles };
};

const validatePlacements = (placements = []) => {
  for (const p of placements) {
    if (!VALID_PLACEMENTS.includes(p)) {
      throw new ApiError(400, `Invalid placement: ${p}`);
    }
  }
  return placements;
};

// Builds + uploads the PDF, returning the { url, public_id, generatedAt }
// shape stored on syllabus.pdf.
const generateAndUploadPdf = async (syllabusData, slug) => {
  const buffer = await generateSyllabusPdf(syllabusData);

  const result = await uploadBufferToCloudinary(buffer, {
    folder: "syllabus",
    filename: `${slug}-${Date.now()}`,
    resourceType: "raw",
  });

  return {
    url: result.secure_url,
    public_id: result.public_id,
    generatedAt: new Date(),
  };
};

// ================= CREATE =================

const createSyllabus = asyncHandler(async (req, res) => {
  const {
    title,
    schoolName,
    classId,
    academicYear,
    description,
    subjects,
    slug,
    status,
    placements,
    accessControl,
  } = req.body;

  if (!title?.trim()) throw new ApiError(400, "Title is required");
  if (!schoolName?.trim()) throw new ApiError(400, "School name is required");

  if (!classId || !mongoose.Types.ObjectId.isValid(classId)) {
    throw new ApiError(400, "A valid class is required");
  }

  const schoolClass = await SchoolClass.findById(classId).lean();
  if (!schoolClass) throw new ApiError(404, "Selected class not found");

  const normalizedSubjects = validateAndNormalizeSubjects(subjects);

  const finalSlug = slugify(slug || `${schoolClass.name}-${title}`);

  const slugExists = await Syllabus.findOne({ slug: finalSlug }).lean();
  if (slugExists) throw new ApiError(400, "A syllabus with this route already exists");

  const pdf = await generateAndUploadPdf(
    {
      schoolName,
      className: schoolClass.name,
      academicYear: academicYear || "",
      description: description || "",
      subjects: normalizedSubjects,
    },
    finalSlug,
  );

  const syllabus = await Syllabus.create({
    title,
    schoolName,
    classId,
    className: schoolClass.name,
    academicYear: academicYear || "",
    description: description || "",
    subjects: normalizedSubjects,
    slug: finalSlug,
    status: status !== undefined ? status : true,
    placements: validatePlacements(placements),
    pdf,
    accessControl: validateAccessControl(accessControl),
  });

  return res.status(201).json(new ApiResponse(201, syllabus, "Syllabus created successfully"));
});

// ================= LIST (admin) =================

const getSyllabi = asyncHandler(async (req, res) => {
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 10);
  const { search, classId } = req.query;

  const filter = {};

  if (classId) {
    if (!mongoose.Types.ObjectId.isValid(classId)) throw new ApiError(400, "Invalid classId");
    filter.classId = classId;
  }

  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: "i" } },
      { schoolName: { $regex: search, $options: "i" } },
      { className: { $regex: search, $options: "i" } },
      { slug: { $regex: search, $options: "i" } },
    ];
  }

  const total = await Syllabus.countDocuments(filter);

  const data = await Syllabus.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  return res.json(
    new ApiResponse(
      200,
      { data, total, page, limit, totalPages: Math.ceil(total / limit) },
      "Syllabi fetched successfully",
    ),
  );
});

// ================= GET ONE (admin, for edit) =================

const getSyllabus = asyncHandler(async (req, res) => {
  const syllabus = await Syllabus.findById(req.params.id);
  if (!syllabus) throw new ApiError(404, "Syllabus not found");
  return res.json(new ApiResponse(200, syllabus, "Syllabus fetched successfully"));
});

// ================= PUBLIC (by slug) =================

const getPublicSyllabus = asyncHandler(async (req, res) => {
  return res.json(new ApiResponse(200, req.resourceDoc, "Syllabus fetched successfully"));
});

// ================= PUBLIC — list by placement =================
// Used by any site section (homepage widget, footer, navbar dropdown)
// to render "which syllabi go here" without hardcoding anything.

const getPublicSyllabiByPlacement = asyncHandler(async (req, res) => {
  const { placement } = req.params;

  if (!VALID_PLACEMENTS.includes(placement)) {
    throw new ApiError(400, "Invalid placement");
  }

  const data = await Syllabus.find({ placements: placement, status: true })
    .select("title slug schoolName className academicYear pdf")
    .sort({ createdAt: -1 })
    .lean();

  return res.json(new ApiResponse(200, data, "Syllabi fetched successfully"));
});

// ================= UPDATE =================

const updateSyllabus = asyncHandler(async (req, res) => {
  const syllabus = await Syllabus.findById(req.params.id);
  if (!syllabus) throw new ApiError(404, "Syllabus not found");

  const {
    title,
    schoolName,
    classId,
    academicYear,
    description,
    subjects,
    slug,
    status,
    placements,
    accessControl,
  } = req.body;

  const oldSlug = syllabus.slug;
  let contentChanged = false;

  if (classId !== undefined) {
    if (!mongoose.Types.ObjectId.isValid(classId)) throw new ApiError(400, "Invalid classId");
    const schoolClass = await SchoolClass.findById(classId).lean();
    if (!schoolClass) throw new ApiError(404, "Selected class not found");
    syllabus.classId = classId;
    syllabus.className = schoolClass.name;
    contentChanged = true;
  }

  if (title !== undefined) {
    syllabus.title = title;
    contentChanged = true;
  }
  if (schoolName !== undefined) {
    syllabus.schoolName = schoolName;
    contentChanged = true;
  }
  if (academicYear !== undefined) {
    syllabus.academicYear = academicYear;
    contentChanged = true;
  }
  if (description !== undefined) {
    syllabus.description = description;
    contentChanged = true;
  }
  if (status !== undefined) syllabus.status = status;
  if (placements !== undefined) syllabus.placements = validatePlacements(placements);
  if (accessControl !== undefined) syllabus.accessControl = validateAccessControl(accessControl);

  if (subjects !== undefined) {
    syllabus.subjects = validateAndNormalizeSubjects(subjects);
    contentChanged = true;
  }

  const finalSlug = slugify(slug || oldSlug);

  if (finalSlug !== oldSlug) {
    const duplicate = await Syllabus.findOne({ slug: finalSlug, _id: { $ne: syllabus._id } }).lean();
    if (duplicate) throw new ApiError(400, "A syllabus with this route already exists");
    syllabus.slug = finalSlug;
    contentChanged = true;
  }

  // Regenerate the PDF whenever anything that affects its content changed.
  if (contentChanged) {
    if (syllabus.pdf?.public_id) {
      await deleteRawFromCloudinary(syllabus.pdf.public_id);
    }

    syllabus.pdf = await generateAndUploadPdf(
      {
        schoolName: syllabus.schoolName,
        className: syllabus.className,
        academicYear: syllabus.academicYear,
        description: syllabus.description,
        subjects: syllabus.subjects,
      },
      syllabus.slug,
    );
  }

  await syllabus.save();

  return res.json(new ApiResponse(200, syllabus, "Syllabus updated successfully"));
});

// ================= DELETE =================

const deleteSyllabus = asyncHandler(async (req, res) => {
  const syllabus = await Syllabus.findById(req.params.id);
  if (!syllabus) throw new ApiError(404, "Syllabus not found");

  if (syllabus.pdf?.public_id) {
    await deleteRawFromCloudinary(syllabus.pdf.public_id);
  }

  await syllabus.deleteOne();

  return res.json(new ApiResponse(200, null, "Syllabus deleted successfully"));
});

module.exports = {
  createSyllabus,
  getSyllabi,
  getSyllabus,
  getPublicSyllabus,
  getPublicSyllabiByPlacement,
  updateSyllabus,
  deleteSyllabus,
};