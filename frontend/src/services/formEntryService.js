import api from "./api";

const BASE = "/form-entries";

// ================= GET =================

export const getEntries = (params) => api.get(BASE, { params });

export const getEntry = (id) => api.get(`${BASE}/${id}`);

export const getEntriesByTableSlug = (tableSlug, params) =>
  api.get(`${BASE}/table/${tableSlug}`, { params });

// ================= EDIT PORTAL =================

export const lookupEntryForEdit = (slug, identifier) =>
  api.post(`${BASE}/portal/${slug}/lookup`, { identifier });

export const updateEntryByEditToken = (token, formData) =>
  api.put(`${BASE}/edit/${token}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

// ================= UPDATE (admin) =================

export const updateEntry = (id, data) =>
  api.patch(`${BASE}/${id}`, {
    data: JSON.stringify(data),
  });

export const updateEntryStatus = (id, payload) =>
  api.patch(`${BASE}/${id}/status`, payload);

// ================= DELETE =================

export const deleteEntry = (id) => api.delete(`${BASE}/${id}`);

export const restoreEntry = (id) => api.patch(`${BASE}/${id}/restore`);

export const permanentlyDeleteEntry = (id) =>
  api.delete(`${BASE}/${id}/permanent`);

// ================= DUPLICATE =================

export const duplicateEntry = (id) => api.post(`${BASE}/${id}/duplicate`);

// ================= BULK ACTION =================

export const bulkEntryAction = (payload) => api.post(`${BASE}/bulk`, payload);

// ================= EXPORT =================

export const exportEntriesCSV = (params) =>
  api.get(`${BASE}/export`, {
    params,
    responseType: "blob",
  });
