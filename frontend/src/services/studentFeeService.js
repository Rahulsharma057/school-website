import api from "./api";

const BASE = "/student-fees";

export const assignFeeToStudent = (data) => api.post(`${BASE}/assign`, data);
export const bulkAssignFeeToClass = (data) => api.post(`${BASE}/bulk-assign`, data);

export const getStudentFee = (id) => api.get(`${BASE}/${id}`);
export const getMyFee = () => api.get(`${BASE}/me`);

export const updateStudentFeeComponent = (id, data) => api.patch(`${BASE}/${id}/component`, data);
export const addCustomFeeComponent = (id, data) => api.post(`${BASE}/${id}/custom-component`, data);
export const removeCustomFeeComponent = (id, componentId) =>
  api.delete(`${BASE}/${id}/custom-component/${componentId}`);

export const getClassFeeSummary = (params) => api.get(`${BASE}/class-summary`, { params });
export const getDueList = (params) => api.get(`${BASE}/due-list`, { params });
export const getStudentFeeByStudentId = (studentId) => api.get(`${BASE}/by-student/${studentId}`);
export const getFeeDashboard = (params) => api.get(`${BASE}/dashboard`, { params });
