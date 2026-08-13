import api from "./api";

export const createExam = (data) => {
  return api.post("/exams", data);
};

export const getExamsByClass = (classId) => {
  return api.get(`/exams/class/${classId}`);
};