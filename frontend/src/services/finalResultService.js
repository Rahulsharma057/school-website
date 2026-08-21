import api from "./api";

// =====================================================
// GENERATE FINAL RESULTS
// POST /final-results/generate
// Body: { classId, academicYear }
// =====================================================

export const generateFinalResults = (data) => {
  return api.post("/final-results/generate", data);
};

// =====================================================
// GET CLASS FINAL RESULTS
// GET /final-results/class?classId=&academicYear=
// =====================================================

export const getClassFinalResults = ({
  classId,
  academicYear,
} = {}) => {
  return api.get("/final-results/class", {
    params: {
      classId,
      academicYear,
    },
  });
};

// =====================================================
// GET MY FINAL RESULTS
// GET /final-results/my-results
// =====================================================

export const getMyFinalResults = () => {
  return api.get("/final-results/my-results");
};

// =====================================================
// PUBLISH FINAL RESULTS
// POST /final-results/publish
// Body: { classId, academicYear }
// =====================================================

export const publishFinalResults = (data) => {
  return api.post("/final-results/publish", data);
};

// =====================================================
// GET SINGLE FINAL RESULT
// GET /final-results/:id
// =====================================================

export const getFinalResultById = (id) => {
  return api.get(`/final-results/${id}`);
};

// =====================================================
// GENERATE SCHOOL FINAL RESULT
// POST /final-results/school/generate
// =====================================================

export const generateSchoolFinalResult = (data) => {
  return api.post("/final-results/school/generate", data);
};