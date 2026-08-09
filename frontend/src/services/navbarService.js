import api from "./api";

// =============================
// GET ADMIN NAVBAR
// =============================

export const getNavbar = () => {
  return api.get("/navbar");
};

// =============================
// GET PUBLIC NAVBAR
// =============================

export const getPublicNavbar = () => {
  return api.get("/navbar/public");
};

// =============================
// CREATE / UPDATE NAVBAR
// =============================

export const updateNavbar = (formData) => {
  return api.put("/navbar", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

// =============================
// ADD MENU
// =============================

export const addMenu = (data) => {
  return api.post("/navbar/menu", data);
};

// =============================
// UPDATE MENU
// =============================

export const updateMenu = (index, data) => {
  return api.put(`/navbar/menu/${index}`, data);
};

// =============================
// DELETE MENU
// =============================

export const deleteMenu = (index) => {
  return api.delete(`/navbar/menu/${index}`);
};

// =============================
// UPDATE MENU ORDER
// =============================

export const updateMenuOrder = (menu) => {
  return api.patch("/navbar/menu/order", {
    menu,
  });
};