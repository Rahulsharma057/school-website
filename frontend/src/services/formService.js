import api from "./api";

// ================= ADMIN =================

export const getForms = (params) => api.get("/forms", { params });

export const getForm = (id) => api.get(`/forms/${id}`);

export const createForm = (data) => api.post("/forms", data);

export const updateForm = (id, data) => api.put(`/forms/${id}`, data);

export const deleteForm = (id) => api.delete(`/forms/${id}`);

// ================= PUBLIC =================

export const getPublicForm = (slug) => api.get(`/forms/public/${slug}`);

// ================= DYNAMIC ADMIN TABLE =================
// Resolves a Form document by its adminTableSlug — used by the dynamic
// /admin/tables/[tableSlug] page to get the form's title/fields/layout
// before fetching its entries.
export const getFormByTableSlug = (tableSlug) =>
  api.get(`/forms/table/${tableSlug}`);