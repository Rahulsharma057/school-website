import api from "./api";

// =====================================================
// ENTER / UPDATE SINGLE RESULT
// POST /results/enter
// =====================================================

export const enterResult = (data) => {
  return api.post("/results/enter", data);
};

// =====================================================
// MY RESULTS
// GET /results/my-results
// =====================================================

export const getMyResults = () => {
  return api.get("/results/my-results");
};

// =====================================================
// CLASS / EXAM RESULTS
// GET /results/exam/:examId
// =====================================================

export const getClassResults = (examId) => {
  return api.get(`/results/exam/${examId}`);
};

// =====================================================
// STUDENT ACADEMIC RESULT
// GET /results/academic
// =====================================================

export const getStudentAcademicResult = ({ studentId, academicYear } = {}) => {
  const params = {};

  if (studentId) {
    params.studentId = studentId;
  }

  if (academicYear) {
    params.academicYear = academicYear;
  }

  return api.get("/results/academic", {
    params,
  });
};

// =====================================================
// DOWNLOAD RESULT TEMPLATE
// GET /results/template/:examId
// =====================================================

export const downloadResultTemplate = (examId) => {
  return api.get(`/results/template/${examId}`, {
    responseType: "blob",
  });
};

// =====================================================
// BULK ENTER RESULTS
// POST /results/bulk
// =====================================================

export const bulkEnterResults = (data) => {
  return api.post("/results/bulk", data);
};
