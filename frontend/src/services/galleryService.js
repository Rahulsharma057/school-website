import api from "./api";

// ================= ADMIN =================

export const getGalleries = (params) => api.get("/galleries", { params });

export const getGallery = (id) => api.get(`/galleries/${id}`);

export const createGallery = (data) => api.post("/galleries", data);

export const updateGallery = (id, data) => api.put(`/galleries/${id}`, data);

export const deleteGallery = (id) => api.delete(`/galleries/${id}`);

// ================= PUBLIC =================

export const getPublicGallery = (slug) => api.get(`/galleries/public/${slug}`);
