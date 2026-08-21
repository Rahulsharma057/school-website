import api from "./api";

// =====================================================
// GET CLASS STUDENTS FOR PROMOTION
// =====================================================

export const getClassStudentsForPromotion = (
  classId
) => {
  return api.get(
    `/promotions/class/${classId}/students`
  );
};

// =====================================================
// GET PROMOTION RESULT
// =====================================================

export const getPromotionResult = ({
  classId,
  academicYear,
} = {}) => {
  const params = {
    classId,
  };

  if (academicYear) {
    params.academicYear =
      academicYear;
  }

  return api.get(
    "/promotions/results",
    {
      params,
    }
  );
};

// =====================================================
// BULK PROMOTE
// =====================================================

export const bulkPromote = (
  data
) => {
  return api.post(
    "/promotions/bulk-promote",
    data
  );
};

// =====================================================
// MY ACADEMIC HISTORY
// =====================================================

export const getMyAcademicHistory =
  () => {
    return api.get(
      "/promotions/history/me"
    );
  };

// =====================================================
// STUDENT ACADEMIC HISTORY
// =====================================================

export const getStudentAcademicHistory =
  (studentId) => {
    return api.get(
      `/promotions/history/${studentId}`
    );
  };