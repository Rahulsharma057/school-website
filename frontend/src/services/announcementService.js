import api from "./api";

// ================= ADMIN =================

export const getAnnouncements = (params) => api.get("/announcements", { params });

export const getAnnouncement = (id) => api.get(`/announcements/${id}`);

// Uses FormData since an attachment file may be included.
const toFormData = (payload) => {
  const fd = new FormData();

  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined) return;

    if (key === "attachment" && value instanceof File) {
      fd.append("attachment", value);
      return;
    }

    if (typeof value === "object" && value !== null) {
      fd.append(key, JSON.stringify(value));
      return;
    }

    fd.append(key, value);
  });

  return fd;
};

export const createAnnouncement = (payload) =>
  api.post("/announcements", toFormData(payload), {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const updateAnnouncement = (id, payload) =>
  api.put(`/announcements/${id}`, toFormData(payload), {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const deleteAnnouncement = (id) => api.delete(`/announcements/${id}`);
export const getPublicAnnouncementsList = (params) =>
  api.get("/announcements/public-list", { params });
// ================= PUBLIC =================

export const getPublicTicker = (placement) =>
  api.get("/announcements/ticker", { params: { placement } });

export const getPublicAnnouncement = (slug) => api.get(`/announcements/public/${slug}`);