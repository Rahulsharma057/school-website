import api from "./api";

// ================= ADMIN =================

export const getPages = (params) =>
  api.get("/custom-pages", { params });

export const getPage = (id) =>
  api.get(`/custom-pages/${id}`);

export const createPage = (data) =>
  api.post("/custom-pages", data, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

export const updatePage = (id, data) =>
  api.put(`/custom-pages/${id}`, data, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

export const deletePage = (id) =>
  api.delete(`/custom-pages/${id}`);

export const updatePageStatus = (id, status) =>
  api.patch(`/custom-pages/${id}/status`, {
    status,
  });

// FIX: NEW
export const duplicatePage = (id) =>
  api.post(`/custom-pages/${id}/duplicate`);

// FIX: NEW — action: "publish" | "unpublish" | "delete"
export const bulkPageAction = ({ ids, action }) =>
  api.patch("/custom-pages/bulk", { ids, action });

// ================= PUBLIC =================

export const getPublicPage = (slug) =>
  api.get(`/custom-pages/public/${slug}`);

// FIX: NEW — used by app/sitemap.js
export const getSitemapData = () =>
  api.get("/custom-pages/sitemap-data");

// FIX: NEW — used by the Media Library picker
export const getMediaLibrary = (params) =>
  api.get("/custom-pages/media-library", { params });
