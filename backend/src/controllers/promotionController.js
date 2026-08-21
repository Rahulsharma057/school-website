const mongoose = require("mongoose");

const StudentProfile =
  require("../models/StudentProfile");

const AcademicHistory =
  require("../models/AcademicHistory");

const Result =
  require("../models/Result");

const generateRollNumber =
  require("../utils/generateRollNumber");

const asyncHandler =
  require("../helpers/asyncHandler");

const ApiResponse =
  require("../helpers/ApiResponse");

// =====================================================
// ACADEMIC YEAR
// =====================================================

const getCurrentAcademicYear = () => {
  const now = new Date();

  const month =
    now.getMonth();

  const year =
    now.getFullYear();

  return month >= 3
    ? `${year}-${year + 1}`
    : `${year - 1}-${year}`;
};

// =====================================================
// GET STUDENTS FOR PROMOTION
// =====================================================

exports.getClassStudentsForPromotion =
  asyncHandler(async (req, res) => {
    const {
      classId,
    } = req.params;

    const students =
      await StudentProfile.find({
        class: classId,
        status: "ACTIVE",
      })
        .populate(
          "user",
          "name email"
        )
        .populate(
          "class",
          "className section"
        )
        .sort({
          rollNumber: 1,
        });

    res.json(
      new ApiResponse(
        200,
        students,
        "Students fetched for promotion"
      )
    );
  });

// =====================================================
// GET STUDENTS WITH FINAL RESULT
// =====================================================

exports.getPromotionResult =
  asyncHandler(async (req, res) => {
    const {
      classId,
      academicYear,
    } = req.query;

    if (!classId) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            null,
            "classId is required"
          )
        );
    }

    const year =
      academicYear ||
      getCurrentAcademicYear();

    const students =
      await StudentProfile.find({
        class: classId,
        status: "ACTIVE",
      })
        .populate(
          "user",
          "name email"
        )
        .sort({
          rollNumber: 1,
        });

    const studentIds =
      students.map(
        (s) => s.user._id
      );

    const results =
      await Result.find({
        student: {
          $in: studentIds,
        },
      }).populate({
        path: "exam",
        match: {
          academicYear: year,
          resultContribution: true,
        },
        select:
          "examName examType weightage isFinal sequence",
      });

    const resultMap =
      new Map();

    for (const student of students) {
      const studentResults =
        results.filter(
          (r) =>
            String(r.student) ===
            String(student.user._id) &&
            r.exam
        );

      let weighted =
        0;

      let weight =
        0;

      let failed =
        false;

      for (const r of studentResults) {
        const examWeight =
          Number(
            r.exam.weightage || 0
          );

        weighted +=
          r.percentage *
          examWeight;

        weight +=
          examWeight;

        if (
          r.overallStatus ===
          "FAIL"
        ) {
          failed = true;
        }
      }

      const percentage =
        weight > 0
          ? Number(
              (
                weighted / weight
              ).toFixed(2)
            )
          : 0;

      resultMap.set(
        String(student.user._id),
        {
          percentage,

          status: failed
            ? "FAIL"
            : "PASS",

          exams:
            studentResults.map(
              (r) => ({
                exam:
                  r.exam.examName,
                percentage:
                  r.percentage,
                status:
                  r.overallStatus,
              })
            ),
        }
      );
    }

    const data =
      students.map(
        (student) => ({
          studentProfileId:
            student._id,

          student:
            student.user,

          rollNumber:
            student.rollNumber,

          result:
            resultMap.get(
              String(
                student.user._id
              )
            ) || {
              percentage: 0,
              status:
                "NO_RESULT",
              exams: [],
            },
        })
      );

    res.json(
      new ApiResponse(
        200,
        data,
        "Promotion results fetched successfully"
      )
    );
  });

// =====================================================
// BULK PROMOTE
// =====================================================

exports.bulkPromote =
  asyncHandler(async (req, res) => {
    const {
      promotions,
      academicYear,
    } = req.body;

    if (
      !Array.isArray(
        promotions
      ) ||
      !promotions.length
    ) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            null,
            "Promotions list is required"
          )
        );
    }

    const year =
      academicYear ||
      getCurrentAcademicYear();

    const allowedResults = [
      "PROMOTED",
      "HOLD_BACK",
      "GRADUATED",
      "FAILED",
      "CONDITIONAL_PROMOTION",
    ];

    const session =
      await mongoose.startSession();

    session.startTransaction();

    const results = [];

    try {
      for (const item of promotions) {
        const {
          studentProfileId,
          result,
          newClassId,
          remarks,
        } = item;

        if (
          !allowedResults.includes(
            result
          )
        ) {
          throw new Error(
            `Invalid promotion result: ${result}`
          );
        }

        const profile =
          await StudentProfile.findById(
            studentProfileId
          ).session(session);

        if (!profile) {
          continue;
        }

        // PROMOTED requires new class
        if (
          result === "PROMOTED" &&
          !newClassId
        ) {
          throw new Error(
            `New class is required for ${studentProfileId}`
          );
        }

        // Save academic history
        await AcademicHistory.create(
          [
            {
              student:
                profile.user,

              class:
                profile.class,

              rollNumber:
                profile.rollNumber,

              academicYear:
                year,

              result,

              remarks:
                remarks || "",

              promotedBy:
                req.user._id,
            },
          ],
          {
            session,
          }
        );

        // =============================================
        // PROMOTED
        // =============================================

        if (
          result ===
          "PROMOTED"
        ) {
          const newRollNumber =
            await generateRollNumber(
              newClassId
            );

          profile.class =
            newClassId;

          profile.rollNumber =
            newRollNumber;

          await profile.save({
            session,
          });
        }

        // =============================================
        // GRADUATED
        // =============================================

        if (
          result ===
          "GRADUATED"
        ) {
          profile.status =
            "GRADUATED";

          await profile.save({
            session,
          });
        }

        // HOLD_BACK / FAILED
        // class remains same

        results.push({
          studentProfileId,
          result,
          newClassId:
            newClassId || null,
        });
      }

      await session.commitTransaction();

      res.json(
        new ApiResponse(
          200,
          results,
          "Promotion process completed"
        )
      );
    } catch (error) {
      await session.abortTransaction();

      throw error;
    } finally {
      await session.endSession();
    }
  });

// =====================================================
// STUDENT ACADEMIC HISTORY
// =====================================================

exports.getStudentHistory =
  asyncHandler(async (req, res) => {
    const studentId =
      req.user.role === "STUDENT"
        ? req.user._id
        : req.params.studentId;

    const history =
      await AcademicHistory.find({
        student: studentId,
      })
        .populate(
          "class",
          "className section"
        )
        .sort({
          createdAt: -1,
        });

    res.json(
      new ApiResponse(
        200,
        history,
        "Academic history fetched"
      )
    );
  });