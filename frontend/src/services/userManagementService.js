import api from "./api";

// GET ALL USERS
export const getAllUsers = (params) => {
  return api.get("/user-management", {
    params,
  });
};

// CHANGE ROLE
export const changeUserRole = (id, role) => {
  return api.patch(`/user-management/${id}/role`, {
    role,
  });
};

// CHANGE STATUS
export const changeUserStatus = (id, isActive) => {
  return api.patch(`/user-management/${id}/status`, {
    isActive,
  });
};

// UPDATE CORE INFO (name/email/phone) — SUPER_ADMIN, ADMIN, PRINCIPAL
export const updateUserCoreInfo = (id, data) => {
  return api.patch(`/user-management/${id}/core-info`, data);
};

// DELETE USER
export const deleteUser = (id) => {
  return api.delete(`/user-management/${id}`);
};