import api from "./api";

export const getClassStudentsForPromotion = (classId) => {
  return api.get(`/promotions/class/${classId}/students`);
};

export const bulkPromote = (data) => {
  return api.post("/promotions/bulk-promote", data);
};

export const getMyAcademicHistory = () => {
  return api.get("/promotions/history/me");
};

export const getStudentAcademicHistory = (studentId) => {
  return api.get(`/promotions/history/${studentId}`);
};