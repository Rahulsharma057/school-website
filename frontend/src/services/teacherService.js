import api from "./api";

export const createTeacher = (data) => {
  return api.post("/teachers", data);
};

export const getMyTeacherProfile = () => {
  return api.get("/teachers/my-profile");
};

export const getAllTeachers = () => {
  return api.get("/teachers");
};

// TEACHER — apni profile update
export const updateMyTeacherProfile = (data) =>
  api.patch("/teachers/my-profile", data);

// TEACHER — apni profile photo upload
// NOTE: route is /teachers/me/profile-photo (matches backend router),
// and Content-Type header is NOT set manually — same reason as in
// studentService.js (FormData needs its own auto-generated boundary).
export const uploadMyTeacherProfilePhoto = (formData) =>
  api.post("/teachers/me/profile-photo", formData);

// ADMIN — kisi bhi teacher ki admin-only fields update karo
export const updateTeacherByAdmin = (teacherId, data) =>
  api.patch(`/teachers/${teacherId}`, data);

// ADMIN — Aadhar card upload
export const uploadTeacherAadhar = (teacherId, formData) =>
  api.post(`/teachers/${teacherId}/aadhar`, formData);
