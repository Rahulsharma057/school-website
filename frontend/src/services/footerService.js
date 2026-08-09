import api from "./api";

export const getFooter = () => api.get("/footer");

export const updateFooter = (data) => api.put("/footer", data);

export const uploadFooterLogo = (file) => {
  const fd = new FormData();
  fd.append("logo", file);
  return api.post("/footer/logo", fd, { headers: { "Content-Type": "multipart/form-data" } });
};

export const removeFooterLogo = () => api.delete("/footer/logo");

export const resetFooter = () => api.post("/footer/reset");
