import api from "./api";

export const getSyllabi = (params = {}) =>
  api.get("/syllabus", { params });

export const getSyllabus = (id) =>
  api.get(`/syllabus/${id}`);

export const createSyllabus = (data) =>
  api.post("/syllabus", data);

export const updateSyllabus = (id, data) =>
  api.put(`/syllabus/${id}`, data);

export const deleteSyllabus = (id) =>
  api.delete(`/syllabus/${id}`);

export const getPublicSyllabus = (slug) =>
  api.get(`/syllabus/public/${slug}`);

export const getSyllabiByPlacement = (placement) =>
  api.get(`/syllabus/placement/${placement}`);