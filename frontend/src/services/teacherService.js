import api from "./api";

// ======================================================
// CREATE TEACHER
// ======================================================

export const createTeacher = (data) => {
  return api.post("/teachers", data);
};

// ======================================================
// MY PROFILE
// ======================================================

export const getMyTeacherProfile = () => {
  return api.get("/teachers/my-profile");
};

// ======================================================
// MY DOCUMENTS (teacher self-service)
// FIX: new — matches the new /teachers/my-profile/documents backend
// routes. Self-uploads land in the otherDocuments bucket.
// ======================================================

export const getMyTeacherDocuments = () => {
  return api.get("/teachers/my-profile/documents");
};

export const uploadMyTeacherDocument = (formData) => {
  return api.post("/teachers/my-profile/documents", formData);
};

export const deleteMyTeacherDocument = (documentId) => {
  return api.delete(`/teachers/my-profile/documents/${documentId}`);
};

// ======================================================
// ALL TEACHERS
// ======================================================

export const getAllTeachers = () => {
  return api.get("/teachers");
};

// ======================================================
// GET TEACHER BY ID
// ======================================================

export const getTeacherById = (teacherId) => {
  return api.get(`/teachers/${teacherId}`);
};

// ======================================================
// TEACHER SELF UPDATE
// ======================================================

export const updateMyTeacherProfile = (data) => {
  return api.patch("/teachers/my-profile", data);
};

// ======================================================
// TEACHER PROFILE PHOTO
// ======================================================

export const uploadMyTeacherProfilePhoto = (formData) => {
  return api.post("/teachers/me/profile-photo", formData);
};

// ======================================================
// ADMIN UPDATE
// ======================================================

export const updateTeacherByAdmin = (teacherId, data) => {
  return api.patch(`/teachers/${teacherId}`, data);
};

// ======================================================
// ADMIN DOCUMENT UPLOAD
// ======================================================

export const uploadTeacherDocument = (teacherId, formData) => {
  return api.post(`/teachers/${teacherId}/documents`, formData);
};

// ======================================================
// ADMIN DOCUMENT DELETE
// FIX: new — the backend gained a delete-document endpoint but nothing
// in the frontend could reach it.
// ======================================================

export const deleteTeacherDocument = (teacherId, documentType, documentId) => {
  const path = documentId
    ? `/teachers/${teacherId}/documents/${documentType}/${documentId}`
    : `/teachers/${teacherId}/documents/${documentType}`;

  return api.delete(path);
};
