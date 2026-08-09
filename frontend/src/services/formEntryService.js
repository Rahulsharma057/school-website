import api from "./api";

const BASE = "/form-entries";

// ================= GET =================

export const getEntries = (params) => api.get(BASE, { params });

export const getEntry = (id) => api.get(`${BASE}/${id}`);

// Table-route-based fetch — used by the dynamic /admin/tables/[tableSlug]
// page. Returns { form, columns, data, total, ... } — columns come
// straight from the form's own field config, so the table never has to
// hardcode which fields exist.
export const getEntriesByTableSlug = (tableSlug, params) =>
  api.get(`${BASE}/table/${tableSlug}`, { params });

// ================= UPDATE =================

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

  // ================= SELF-SERVICE EDIT (public, by token) =================

export const getEntryByEditToken = (token) => api.get(`${BASE}/edit/${token}`);

export const updateEntryByEditToken = (token, formData) =>
  api.put(`${BASE}/edit/${token}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });