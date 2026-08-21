import api from "./api";

// =====================================================
// PROGRAMS
// =====================================================

export const getAllPrograms = (params = {}) => {
  return api.get("/programs", { params });
};

export const getProgramById = (id) => {
  return api.get(`/programs/${id}`);
};

export const createProgram = (data) => {
  return api.post("/programs", data);
};

export const updateProgram = (id, data) => {
  return api.put(`/programs/${id}`, data);
};

export const deleteProgram = (id) => {
  return api.delete(`/programs/${id}`);
};