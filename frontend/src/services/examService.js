import api from "./api";

// ================= CREATE EXAM =================

export const createExam = (data) => {
  return api.post("/exams", data);
};

// ================= GET EXAMS BY CLASS =================

export const getExamsByClass = (classId) => {
  return api.get(`/exams/class/${classId}`);
};

// ================= GET SINGLE EXAM =================

export const getExamById = (examId) => {
  return api.get(`/exams/${examId}`);
};

// ================= UPDATE EXAM =================

export const updateExam = (examId, data) => {
  return api.put(`/exams/${examId}`, data);
};

// ================= DELETE EXAM =================

export const deleteExam = (examId) => {
  return api.delete(`/exams/${examId}`);
};