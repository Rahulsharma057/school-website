// Shared axios instance (baseURL + credentials + 401 redirect handling)
import api from "./api";

// ---------- PUBLIC ----------

export const getPublicNews = (params) => api.get("/news", { params });

export const getPublicNewsBySlug = (slug) => api.get(`/news/${slug}`);

// ---------- ADMIN ----------

export const getAdminNewsList = (params) => api.get("/news/admin", { params });

export const getAdminNewsById = (id) => api.get(`/news/admin/${id}`);

// `payload` is a plain object; this builds the multipart FormData so the
// caller (the create/edit form) never has to think about field names.
const buildNewsFormData = (payload) => {
  const formData = new FormData();

  const scalarKeys = [
    "title",
    "heading",
    "slug",
    "excerpt",
    "content",
    "category",
    "status",
    "isFeatured",
    "author",
    "seoMetaTitle",
    "seoMetaDescription",
  ];

  scalarKeys.forEach((key) => {
    if (payload[key] !== undefined && payload[key] !== null) {
      formData.append(key, payload[key]);
    }
  });

  if (payload.tags) {
    formData.append("tags", Array.isArray(payload.tags) ? payload.tags.join(",") : payload.tags);
  }

  if (payload.coverImage instanceof File) {
    formData.append("coverImage", payload.coverImage);
  }

  if (Array.isArray(payload.galleryFiles)) {
    payload.galleryFiles.forEach((file) => formData.append("gallery", file));
  }

  if (Array.isArray(payload.removeGalleryIds) && payload.removeGalleryIds.length) {
    formData.append("removeGalleryIds", JSON.stringify(payload.removeGalleryIds));
  }

  return formData;
};

export const createNews = (payload) =>
  api.post("/news/admin", buildNewsFormData(payload), {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const updateNews = (id, payload) =>
  api.put(`/news/admin/${id}`, buildNewsFormData(payload), {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const deleteNews = (id) => api.delete(`/news/admin/${id}`);

export const reorderNews = (items) => api.patch("/news/admin/reorder", { items });

export const updateNewsStatus = (id, status) => api.patch(`/news/admin/${id}/status`, { status });
