import api from "./api";

const BASE = "/gallery-images";

// ================= GET (paginated — public) =================

export const getGalleryImages = (galleryId, params) =>
  api.get(`${BASE}/gallery/${galleryId}`, { params });

// ================= UPLOAD (admin — one or many files) =================

export const uploadGalleryImages = (galleryId, files) => {
  const fd = new FormData();
  fd.append("galleryId", galleryId);

  files.forEach((file) => fd.append("images", file));

  return api.post(BASE, fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

// ================= REORDER (admin — drag-and-drop) =================
// order: [{ id, order }, ...]

export const reorderGalleryImages = (galleryId, order) =>
  api.patch(`${BASE}/reorder`, { galleryId, order });

// ================= UPDATE (caption / alt text) =================

export const updateGalleryImage = (id, data) => api.patch(`${BASE}/${id}`, data);

// ================= DELETE =================

export const deleteGalleryImage = (id) => api.delete(`${BASE}/${id}`);

export const bulkDeleteGalleryImages = (ids) => api.delete(`${BASE}/bulk`, { data: { ids } });
