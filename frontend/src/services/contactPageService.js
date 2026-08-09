import api from "./api";

// ================= ADMIN =================

export const getContactPages = (params) => api.get("/contact-pages", { params });
export const getContactPage = (id) => api.get(`/contact-pages/${id}`);
export const createContactPage = (data) => api.post("/contact-pages", data);
export const updateContactPage = (id, data) => api.put(`/contact-pages/${id}`, data);
export const deleteContactPage = (id) => api.delete(`/contact-pages/${id}`);

// ================= PUBLIC =================

export const getPublicContactPage = (slug) => api.get(`/contact-pages/public/${slug}`);