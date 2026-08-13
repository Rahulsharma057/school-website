import api from "./api";

const BASE = "/fee-structures";

export const getFeeStructures = (params) => api.get(BASE, { params });
export const getFeeStructure = (id) => api.get(`${BASE}/${id}`);
export const createFeeStructure = (data) => api.post(BASE, data);
export const updateFeeStructure = (id, data) => api.put(`${BASE}/${id}`, data);
export const deleteFeeStructure = (id) => api.delete(`${BASE}/${id}`);