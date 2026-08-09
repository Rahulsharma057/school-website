import api from "./api";

export const getSchoolClasses = (params) => api.get("/school-classes", { params });
export const createSchoolClass = (data) => api.post("/school-classes", data);
export const updateSchoolClass = (id, data) => api.put(`/school-classes/${id}`, data);
export const deleteSchoolClass = (id) => api.delete(`/school-classes/${id}`);