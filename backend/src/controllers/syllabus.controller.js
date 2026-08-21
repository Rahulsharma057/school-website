const mongoose = require("mongoose");

const Syllabus = require("../models/Syllabus");
const Class = require("../models/Class");

const generateSyllabusPdf = require("../utils/generateSyllabusPdf");
const uploadBufferToCloudinary = require("../utils/uploadBufferToCloudinary");
const deleteRawFromCloudinary = require("../utils/deleteRawFromCloudinary");

const asyncHandler = require("../helpers/asyncHandler");
const ApiResponse = require("../helpers/ApiResponse");
const ApiError = require("../helpers/ApiError");

// =====================================================
// HELPERS
// =====================================================

const slugify = (text = "") =>
  text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-");

// =====================================================
// VALID VALUES
// =====================================================

const VALID_ROLES = [
  "SUPER_ADMIN",
  "ADMIN",
  "EDITOR",
  "VIEWER",
];

const VALID_PLACEMENTS = [
  "homepage",
  "academics-page",
  "navbar-dropdown",
  "footer",
  "notice-board",
];

// =====================================================
// NORMALIZE SUBJECTS
// =====================================================

const validateAndNormalizeSubjects = (subjects = []) => {
  if (!Array.isArray(subjects) || subjects.length === 0) {
    throw new ApiError(
      400,
      "Syllabus must have at least one subject"
    );
  }

  return subjects.map((subject, subjectIndex) => {
    if (!subject?.name?.trim()) {
      throw new ApiError(
        400,
        "Every subject needs a name"
      );
    }

    const topics = Array.isArray(subject.topics)
      ? subject.topics
      : [];

    return {
      id:
        subject.id ||
        new mongoose.Types.ObjectId().toString(),

      name: subject.name.trim(),

      order:
        subject.order !== undefined
          ? Number(subject.order)
          : subjectIndex,

      topics: topics.map((topic, topicIndex) => {
        if (!topic?.title?.trim()) {
          throw new ApiError(
            400,
            `A topic under "${subject.name}" is missing a title`
          );
        }

        const subtopics = Array.isArray(topic.subtopics)
          ? topic.subtopics
          : [];

        return {
          id:
            topic.id ||
            new mongoose.Types.ObjectId().toString(),

          title: topic.title.trim(),

          description:
            topic.description?.trim() || "",

          order:
            topic.order !== undefined
              ? Number(topic.order)
              : topicIndex,

          subtopics: subtopics.map(
            (subtopic, subtopicIndex) => {
              if (!subtopic?.title?.trim()) {
                throw new ApiError(
                  400,
                  `A subtopic under "${topic.title}" is missing a title`
                );
              }

              return {
                id:
                  subtopic.id ||
                  new mongoose.Types.ObjectId().toString(),

                title: subtopic.title.trim(),

                description:
                  subtopic.description?.trim() || "",

                order:
                  subtopic.order !== undefined
                    ? Number(subtopic.order)
                    : subtopicIndex,
              };
            }
          ),
        };
      }),
    };
  });
};

// =====================================================
// ACCESS CONTROL
// =====================================================

const validateAccessControl = (accessControl) => {
  if (!accessControl) {
    return {
      viewRoles: [],
    };
  }

  const viewRoles = Array.isArray(accessControl.viewRoles)
    ? accessControl.viewRoles
    : [];

  for (const role of viewRoles) {
    if (!VALID_ROLES.includes(role)) {
      throw new ApiError(
        400,
        `Invalid role in accessControl: ${role}`
      );
    }
  }

  return {
    viewRoles,
  };
};

// =====================================================
// PLACEMENTS
// =====================================================

const validatePlacements = (placements = []) => {
  if (!Array.isArray(placements)) {
    throw new ApiError(
      400,
      "placements must be an array"
    );
  }

  for (const placement of placements) {
    if (!VALID_PLACEMENTS.includes(placement)) {
      throw new ApiError(
        400,
        `Invalid placement: ${placement}`
      );
    }
  }

  return placements;
};

// =====================================================
// GENERATE PDF + UPLOAD
// =====================================================

const generateAndUploadPdf = async (
  syllabusData,
  slug
) => {
  const buffer = await generateSyllabusPdf(
    syllabusData
  );

  const result = await uploadBufferToCloudinary(
    buffer,
    {
      folder: "syllabus",
      filename: `${slug}-${Date.now()}`,
      resourceType: "raw",
    }
  );

  return {
    url: result.secure_url,
    public_id: result.public_id,
    generatedAt: new Date(),
  };
};

// =====================================================
// CREATE SYLLABUS
// =====================================================

const createSyllabus = asyncHandler(
  async (req, res) => {
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

    // -----------------------------------------------
    // TITLE
    // -----------------------------------------------

    if (!title?.trim()) {
      throw new ApiError(
        400,
        "Title is required"
      );
    }

    // -----------------------------------------------
    // SCHOOL NAME
    // -----------------------------------------------

    if (!schoolName?.trim()) {
      throw new ApiError(
        400,
        "School name is required"
      );
    }

    // -----------------------------------------------
    // CLASS ID
    // -----------------------------------------------

    if (
      !classId ||
      !mongoose.Types.ObjectId.isValid(classId)
    ) {
      throw new ApiError(
        400,
        "A valid class is required"
      );
    }

    // -----------------------------------------------
    // FIND ACTUAL CLASS MODEL
    // -----------------------------------------------

    const selectedClass = await Class.findById(
      classId
    ).lean();

    if (!selectedClass) {
      throw new ApiError(
        404,
        "Selected class not found"
      );
    }

    // -----------------------------------------------
    // CLASS NAME
    // -----------------------------------------------

    const className = `${selectedClass.className}${
      selectedClass.section
        ? ` - ${selectedClass.section}`
        : ""
    }`;

    // -----------------------------------------------
    // SUBJECTS
    // -----------------------------------------------

    const normalizedSubjects =
      validateAndNormalizeSubjects(subjects);

    // -----------------------------------------------
    // SLUG
    // -----------------------------------------------

    const finalSlug = slugify(
      slug || `${className}-${title}`
    );

    const slugExists = await Syllabus.findOne({
      slug: finalSlug,
    }).lean();

    if (slugExists) {
      throw new ApiError(
        400,
        "A syllabus with this route already exists"
      );
    }

    // -----------------------------------------------
    // PDF
    // -----------------------------------------------

    const pdf = await generateAndUploadPdf(
      {
        schoolName: schoolName.trim(),

        className,

        academicYear:
          academicYear?.trim() || "",

        description:
          description?.trim() || "",

        subjects: normalizedSubjects,
      },
      finalSlug
    );

    // -----------------------------------------------
    // CREATE
    // -----------------------------------------------

    const syllabus = await Syllabus.create({
      title: title.trim(),

      schoolName: schoolName.trim(),

      classId: selectedClass._id,

      className,

      academicYear:
        academicYear?.trim() || "",

      description:
        description?.trim() || "",

      subjects: normalizedSubjects,

      slug: finalSlug,

      status:
        status !== undefined
          ? Boolean(status)
          : true,

      placements:
        validatePlacements(
          placements || []
        ),

      pdf,

      accessControl:
        validateAccessControl(
          accessControl
        ),
    });

    return res
      .status(201)
      .json(
        new ApiResponse(
          201,
          syllabus,
          "Syllabus created successfully"
        )
      );
  }
);

// =====================================================
// GET ALL SYLLABI
// =====================================================

const getSyllabi = asyncHandler(
  async (req, res) => {
    const page = Math.max(
      Number(req.query.page || 1),
      1
    );

    const limit = Math.min(
      Math.max(
        Number(req.query.limit || 10),
        1
      ),
      100
    );

    const {
      search,
      classId,
      academicYear,
    } = req.query;

    const filter = {};

    // -----------------------------------------------
    // CLASS FILTER
    // -----------------------------------------------

    if (classId) {
      if (
        !mongoose.Types.ObjectId.isValid(
          classId
        )
      ) {
        throw new ApiError(
          400,
          "Invalid classId"
        );
      }

      filter.classId = classId;
    }

    // -----------------------------------------------
    // ACADEMIC YEAR
    // -----------------------------------------------

    if (academicYear) {
      filter.academicYear =
        academicYear;
    }

    // -----------------------------------------------
    // SEARCH
    // -----------------------------------------------

    if (search?.trim()) {
      filter.$or = [
        {
          title: {
            $regex: search.trim(),
            $options: "i",
          },
        },
        {
          schoolName: {
            $regex: search.trim(),
            $options: "i",
          },
        },
        {
          className: {
            $regex: search.trim(),
            $options: "i",
          },
        },
        {
          slug: {
            $regex: search.trim(),
            $options: "i",
          },
        },
      ];
    }

    const total =
      await Syllabus.countDocuments(
        filter
      );

    const data =
      await Syllabus.find(filter)
        .sort({
          createdAt: -1,
        })
        .skip(
          (page - 1) * limit
        )
        .limit(limit)
        .lean();

    return res.json(
      new ApiResponse(
        200,
        {
          data,
          total,
          page,
          limit,
          totalPages:
            Math.ceil(
              total / limit
            ),
        },
        "Syllabi fetched successfully"
      )
    );
  }
);

// =====================================================
// GET ONE SYLLABUS
// =====================================================

const getSyllabus = asyncHandler(
  async (req, res) => {
    if (
      !mongoose.Types.ObjectId.isValid(
        req.params.id
      )
    ) {
      throw new ApiError(
        400,
        "Invalid syllabus id"
      );
    }

    const syllabus =
      await Syllabus.findById(
        req.params.id
      );

    if (!syllabus) {
      throw new ApiError(
        404,
        "Syllabus not found"
      );
    }

    return res.json(
      new ApiResponse(
        200,
        syllabus,
        "Syllabus fetched successfully"
      )
    );
  }
);

// =====================================================
// GET SYLLABUS BY CLASS
// =====================================================

const getSyllabusByClass =
  asyncHandler(async (req, res) => {
    const {
      classId,
      academicYear,
    } = req.query;

    if (
      !classId ||
      !mongoose.Types.ObjectId.isValid(
        classId
      )
    ) {
      throw new ApiError(
        400,
        "Valid classId is required"
      );
    }

    const filter = {
      classId,
      status: true,
    };

    if (academicYear) {
      filter.academicYear =
        academicYear;
    }

    const syllabus =
      await Syllabus.findOne(filter)
        .sort({
          createdAt: -1,
        })
        .lean();

    if (!syllabus) {
      return res.json(
        new ApiResponse(
          200,
          null,
          "No syllabus found for this class"
        )
      );
    }

    return res.json(
      new ApiResponse(
        200,
        syllabus,
        "Syllabus fetched successfully"
      )
    );
  });

// =====================================================
// GET SUBJECTS BY CLASS
// =====================================================

const getSubjectsByClass =
  asyncHandler(async (req, res) => {
    const {
      classId,
      academicYear,
    } = req.query;

    if (
      !classId ||
      !mongoose.Types.ObjectId.isValid(
        classId
      )
    ) {
      throw new ApiError(
        400,
        "Valid classId is required"
      );
    }

    const filter = {
      classId,
      status: true,
    };

    if (academicYear) {
      filter.academicYear =
        academicYear;
    }

    const syllabus =
      await Syllabus.findOne(filter)
        .sort({
          createdAt: -1,
        })
        .select(
          "subjects classId className academicYear title"
        )
        .lean();

    if (!syllabus) {
      return res.json(
        new ApiResponse(
          200,
          [],
          "No subjects found for this class"
        )
      );
    }

    const subjects =
      (syllabus.subjects || [])
        .sort(
          (a, b) =>
            a.order - b.order
        )
        .map((subject) => ({
          id: subject.id,
          name: subject.name,
          order: subject.order,
          topics:
            subject.topics || [],
        }));

    return res.json(
      new ApiResponse(
        200,
        subjects,
        "Subjects fetched successfully"
      )
    );
  });

// =====================================================
// PUBLIC BY SLUG
// =====================================================

const getPublicSyllabus =
  asyncHandler(async (req, res) => {
    return res.json(
      new ApiResponse(
        200,
        req.resourceDoc,
        "Syllabus fetched successfully"
      )
    );
  });

// =====================================================
// PUBLIC BY PLACEMENT
// =====================================================

const getPublicSyllabiByPlacement =
  asyncHandler(async (req, res) => {
    const { placement } =
      req.params;

    if (
      !VALID_PLACEMENTS.includes(
        placement
      )
    ) {
      throw new ApiError(
        400,
        "Invalid placement"
      );
    }

    const data =
      await Syllabus.find({
        placements: placement,
        status: true,
      })
        .select(
          "title slug schoolName className academicYear pdf"
        )
        .sort({
          createdAt: -1,
        })
        .lean();

    return res.json(
      new ApiResponse(
        200,
        data,
        "Syllabi fetched successfully"
      )
    );
  });

// =====================================================
// UPDATE SYLLABUS
// =====================================================

const updateSyllabus =
  asyncHandler(async (req, res) => {
    const syllabus =
      await Syllabus.findById(
        req.params.id
      );

    if (!syllabus) {
      throw new ApiError(
        404,
        "Syllabus not found"
      );
    }

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

    const oldSlug =
      syllabus.slug;

    let contentChanged =
      false;

    // -----------------------------------------------
    // CLASS
    // -----------------------------------------------

    if (classId !== undefined) {
      if (
        !mongoose.Types.ObjectId.isValid(
          classId
        )
      ) {
        throw new ApiError(
          400,
          "Invalid classId"
        );
      }

      const selectedClass =
        await Class.findById(
          classId
        ).lean();

      if (!selectedClass) {
        throw new ApiError(
          404,
          "Selected class not found"
        );
      }

      const className =
        `${selectedClass.className}${
          selectedClass.section
            ? ` - ${selectedClass.section}`
            : ""
        }`;

      syllabus.classId =
        selectedClass._id;

      syllabus.className =
        className;

      contentChanged =
        true;
    }

    // -----------------------------------------------
    // TITLE
    // -----------------------------------------------

    if (title !== undefined) {
      if (!title.trim()) {
        throw new ApiError(
          400,
          "Title cannot be empty"
        );
      }

      syllabus.title =
        title.trim();

      contentChanged =
        true;
    }

    // -----------------------------------------------
    // SCHOOL NAME
    // -----------------------------------------------

    if (
      schoolName !== undefined
    ) {
      if (!schoolName.trim()) {
        throw new ApiError(
          400,
          "School name cannot be empty"
        );
      }

      syllabus.schoolName =
        schoolName.trim();

      contentChanged =
        true;
    }

    // -----------------------------------------------
    // ACADEMIC YEAR
    // -----------------------------------------------

    if (
      academicYear !== undefined
    ) {
      syllabus.academicYear =
        academicYear.trim();

      contentChanged =
        true;
    }

    // -----------------------------------------------
    // DESCRIPTION
    // -----------------------------------------------

    if (
      description !== undefined
    ) {
      syllabus.description =
        description;

      contentChanged =
        true;
    }

    // -----------------------------------------------
    // SUBJECTS
    // -----------------------------------------------

    if (subjects !== undefined) {
      syllabus.subjects =
        validateAndNormalizeSubjects(
          subjects
        );

      contentChanged =
        true;
    }

    // -----------------------------------------------
    // STATUS
    // -----------------------------------------------

    if (status !== undefined) {
      syllabus.status =
        Boolean(status);
    }

    // -----------------------------------------------
    // PLACEMENTS
    // -----------------------------------------------

    if (
      placements !== undefined
    ) {
      syllabus.placements =
        validatePlacements(
          placements
        );
    }

    // -----------------------------------------------
    // ACCESS CONTROL
    // -----------------------------------------------

    if (
      accessControl !== undefined
    ) {
      syllabus.accessControl =
        validateAccessControl(
          accessControl
        );
    }

    // -----------------------------------------------
    // SLUG
    // -----------------------------------------------

    const finalSlug =
      slugify(
        slug || oldSlug
      );

    if (
      finalSlug !== oldSlug
    ) {
      const duplicate =
        await Syllabus.findOne({
          slug: finalSlug,
          _id: {
            $ne: syllabus._id,
          },
        }).lean();

      if (duplicate) {
        throw new ApiError(
          400,
          "A syllabus with this route already exists"
        );
      }

      syllabus.slug =
        finalSlug;

      contentChanged =
        true;
    }

    // -----------------------------------------------
    // REGENERATE PDF
    // -----------------------------------------------

    if (contentChanged) {
      if (
        syllabus.pdf?.public_id
      ) {
        try {
          await deleteRawFromCloudinary(
            syllabus.pdf.public_id
          );
        } catch (error) {
          console.error(
            "Old syllabus PDF delete failed:",
            error.message
          );
        }
      }

      syllabus.pdf =
        await generateAndUploadPdf(
          {
            schoolName:
              syllabus.schoolName,

            className:
              syllabus.className,

            academicYear:
              syllabus.academicYear,

            description:
              syllabus.description,

            subjects:
              syllabus.subjects,
          },
          syllabus.slug
        );
    }

    await syllabus.save();

    return res.json(
      new ApiResponse(
        200,
        syllabus,
        "Syllabus updated successfully"
      )
    );
  });

// =====================================================
// DELETE
// =====================================================

const deleteSyllabus =
  asyncHandler(async (req, res) => {
    const syllabus =
      await Syllabus.findById(
        req.params.id
      );

    if (!syllabus) {
      throw new ApiError(
        404,
        "Syllabus not found"
      );
    }

    if (
      syllabus.pdf?.public_id
    ) {
      try {
        await deleteRawFromCloudinary(
          syllabus.pdf.public_id
        );
      } catch (error) {
        console.error(
          "PDF delete failed:",
          error.message
        );
      }
    }

    await syllabus.deleteOne();

    return res.json(
      new ApiResponse(
        200,
        null,
        "Syllabus deleted successfully"
      )
    );
  });

// =====================================================
// EXPORT
// =====================================================

module.exports = {
  createSyllabus,
  getSyllabi,
  getSyllabus,
  getSyllabusByClass,
  getSubjectsByClass,
  getPublicSyllabus,
  getPublicSyllabiByPlacement,
  updateSyllabus,
  deleteSyllabus,
};