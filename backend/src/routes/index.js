const express = require("express");

const router = express.Router();

const authRoutes = require("./authRoutes");
const userRoutes = require("./userRoutes");
const userManagementRoutes = require("./userManagementRoutes");
const homeSliderRoutes = require("./homeSliderRoutes");
const navbarRoutes = require("./navbarRoutes");
const customPageRoutes = require("./customPageRoutes");
const formEntryRoutes = require("./formEntry.routes");
const formRoutes = require("./form.routes");
const schoolClassRoutes = require("./schoolClass.routes");
const syllabusRoutes = require("./syllabus.routes");
const galleryRoutes = require("./gallery.routes");
const galleryImageRoutes = require("./galleryImage.routes");
const quoteRoutes = require("./quote.routes");
const quoteSectionRoutes = require("./quoteSection.routes");
const newsRoutes = require("./news.routes");
const newsSectionRoutes = require("./newssection.routes");
const announcementRoutes = require("./announcement.routes");
const contactPageRoutes = require("./contactPage.routes");
const footerRoutes = require("./footer.routes");
const studentRoutes = require("./studentRoutes");
const teacherAssignmentRoutes = require("./teacherAssignmentRoutes");
const teacherRoutes = require("./teacherRoutes");
const promotionRoutes = require("./promotionRoutes");
const classRoutes = require("./classRoutes");
const studentLifecycleRoutes = require("./studentLifecycleRoutes");
const attendanceRoutes = require("./attendanceRoutes");
const examRoutes = require("./examRoutes");
const resultRoutes = require("./resultRoutes");
const holidayRoutes = require("./holidayRoutes");
const teacherAttendanceRoutes = require("./teacherAttendanceRoutes");
const salaryRoutes = require("./salaryRoutes");
// AUTH
router.use("/auth", authRoutes);
// USER PROFILE
router.use("/users", userRoutes);
// USER MANAGEMENT
router.use("/user-management", userManagementRoutes);
// HOME SLIDER
router.use("/home-slider", homeSliderRoutes);
// NAVBAR
router.use("/navbar", navbarRoutes);
// CUSTOM PAGES
router.use("/custom-pages", customPageRoutes);
// FORM BUILDER (admin-defined forms)
router.use("/forms", formRoutes);
// FORM ENTRIES (submissions)
router.use("/form-entries", formEntryRoutes);
// SCHOOL CLASSES (reusable class list — Nursery, Class 10, etc.)
router.use("/school-classes", schoolClassRoutes);
// SYLLABUS (per-class syllabus + auto-generated PDF)
router.use("/syllabus", syllabusRoutes);
// GALLERY (admin-defined photo galleries)
router.use("/galleries", galleryRoutes);
// GALLERY IMAGES (individual photos, paginated)
router.use("/gallery-images", galleryImageRoutes);
router.use("/quotes", quoteRoutes);
router.use("/quote-sections", quoteSectionRoutes);
router.use("/announcements", announcementRoutes);
router.use("/news", newsRoutes);

router.use("/news-sections", newsSectionRoutes);
router.use("/contact-pages", contactPageRoutes);
router.use("/students", studentRoutes);
router.use("/teachers", teacherRoutes);
router.use("/promotions", promotionRoutes);
router.use("/teacher-assignments", teacherAssignmentRoutes);
router.use("/footer", footerRoutes);
router.use("/classes", classRoutes);
router.use("/student-lifecycle", studentLifecycleRoutes);
router.use("/attendance", attendanceRoutes);
router.use("/exams", examRoutes);
router.use("/results", resultRoutes);
router.use("/holidays", holidayRoutes);
router.use("/teacher-attendance", teacherAttendanceRoutes);
router.use("/salary", salaryRoutes);
router.use("/leave-quota", require("./leaveQuotaRoutes"));
router.use("/leave-requests", require("./leaveRequestRoutes"));
router.use("/salary-adjustments", require("./salaryAdjustmentRoutes"));
router.use("/export", require("./exportRoutes"));
router.use("/period-slots", require("./periodSlotRoutes"));
router.use("/timetable", require("./timetableRoutes"));
router.use("/fee-structures", require("./feeStructureRoutes"));
router.use("/student-fees", require("./studentFeeRoutes"));
router.use("/fee-payments", require("./feePaymentRoutes"));
router.use("/tasks", require("./taskRoutes"));
router.use("/assessments", require("./assessmentRoutes"));
router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "School Website API v1 Running",
  });
});

module.exports = router;
