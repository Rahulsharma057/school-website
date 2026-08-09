import api from "./api";

const BASE = "/quotes";

// ================= ADMIN =================

export const getQuotes = (params) => api.get(BASE, { params });

export const getQuote = (id) => api.get(`${BASE}/${id}`);

export const createQuote = (formData) =>
  api.post(BASE, formData, { headers: { "Content-Type": "multipart/form-data" } });

export const updateQuote = (id, formData) =>
  api.put(`${BASE}/${id}`, formData, { headers: { "Content-Type": "multipart/form-data" } });

export const deleteQuote = (id) => api.delete(`${BASE}/${id}`);

export const toggleQuoteStatus = (id) => api.patch(`${BASE}/${id}/status`);

export const reorderQuotes = (order) => api.patch(`${BASE}/reorder`, { order });

// ================= PUBLIC =================

export const getPublicQuotes = (params) => api.get(`${BASE}/public`, { params });
