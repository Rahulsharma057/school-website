import api from "./api";

export const addAdjustment = (data) => api.post("/salary-adjustments", data);
export const getAdjustments = (salaryId) => api.get(`/salary-adjustments/${salaryId}`);