import api from "./api";

// CREATE STUDENT (Principal/Admin)
export const createStudent = (data) => {
  return api.post("/students", data);
};

// STUDENT — apna profile
export const getMyStudentProfile = () => {
  return api.get("/students/my-profile");
};

// STUDENT — apni profile photo upload
// NOTE: route is /students/me/profile-photo (matches backend router),
// and Content-Type header is NOT set manually — the browser/axios sets
// multipart/form-data with the correct boundary automatically when you
// pass a FormData instance. Setting it by hand strips the boundary and
// can break parsing on the multer side.
export const uploadMyStudentProfilePhoto = (formData) =>
  api.post("/students/me/profile-photo", formData);

export const getStudentsByClass = (classId) => {
  return api.get(`/students/by-class/${classId}`);
};

export const updateMyStudentProfile = (data) =>
  api.patch("/students/my-profile", data);

// ADMIN — kisi bhi student ki admin-only fields update karo
export const updateStudentByAdmin = (studentId, data) =>
  api.patch(`/students/${studentId}`, data);

// ADMIN — Aadhar card upload
export const uploadStudentAadhar = (studentId, formData) =>
  api.post(`/students/${studentId}/aadhar`, formData);
