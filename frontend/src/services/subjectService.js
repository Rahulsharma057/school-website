import api from "./api";

// =====================================================
// SUBJECTS
// =====================================================

export const getAllSubjects = (params = {}) => {
  return api.get("/subjects", { params });
};

export const createSubject = (data) => {
  return api.post("/subjects", data);
};

export const updateSubject = (id, data) => {
  return api.put(`/subjects/${id}`, data);
};

export const deleteSubject = (id) => {
  return api.delete(`/subjects/${id}`);
};