import api from "./api";

const BASE = "/news-sections";

// ================= ADMIN =================

export const getSections = (params) => api.get(BASE, { params });

export const getSection = (id) => api.get(`${BASE}/${id}`);

export const createSection = (data) => api.post(BASE, data);

export const updateSection = (id, data) => api.put(`${BASE}/${id}`, data);

export const deleteSection = (id) => api.delete(`${BASE}/${id}`);

// ================= PUBLIC =================

export const getPublicSection = (slug, params) => api.get(`${BASE}/public/${slug}`, { params });
