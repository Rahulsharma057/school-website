
import api from "./api";

// =====================================================
// CREATE EXAM
// =====================================================

export const createExam = async (payload) => {
  const { data } = await api.post("/exams", payload);
  return data;
};

// =====================================================
// GET ALL EXAMS
// =====================================================

export const getAllExams = async (params = {}) => {
  const { data } = await api.get("/exams", {
    params,
  });

  return data;
};

// =====================================================
// GET SCHOOL EXAMS
// =====================================================

export const getSchoolExams = async (classId, params = {}) => {
  if (!classId) {
    throw new Error("Class ID is required");
  }

  const { data } = await api.get(
    `/exams/school/class/${classId}`,
    {
      params,
    }
  );

  return data;
};

// =====================================================
// GET COLLEGE EXAMS
// =====================================================

export const getCollegeExams = async (
  programId,
  semester,
  params = {}
) => {
  if (!programId) {
    throw new Error("Program ID is required");
  }

  if (!semester) {
    throw new Error("Semester is required");
  }

  const { data } = await api.get(
    `/exams/college/${programId}/semester/${semester}`,
    {
      params,
    }
  );

  return data;
};

// =====================================================
// GET COLLEGE SEMESTER STRUCTURE
// =====================================================

export const getCollegeSemesterStructure = async (
  programId
) => {
  if (!programId) {
    throw new Error("Program ID is required");
  }

  const { data } = await api.get(
    `/exams/college/${programId}/semesters`
  );

  return data;
};

// =====================================================
// GET SINGLE EXAM
// =====================================================

export const getExamById = async (examId) => {
  if (!examId) {
    throw new Error("Exam ID is required");
  }

  const { data } = await api.get(`/exams/${examId}`);

  return data;
};

// =====================================================
// UPDATE EXAM
// =====================================================

export const updateExam = async ({ examId, payload }) => {
  if (!examId) {
    throw new Error("Exam ID is required");
  }

  const { data } = await api.put(
    `/exams/${examId}`,
    payload
  );

  return data;
};

// =====================================================
// DELETE EXAM
// =====================================================

export const deleteExam = async (examId) => {
  if (!examId) {
    throw new Error("Exam ID is required");
  }

  const { data } = await api.delete(
    `/exams/${examId}`
  );

  return data;
};

