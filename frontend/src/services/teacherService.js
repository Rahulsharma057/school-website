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
  return api.post(
    "/teachers/me/profile-photo",
    formData
  );
};

// ======================================================
// ADMIN UPDATE
// ======================================================

export const updateTeacherByAdmin = (
  teacherId,
  data
) => {
  return api.patch(
    `/teachers/${teacherId}`,
    data
  );
};

// ======================================================
// ADMIN DOCUMENT UPLOAD
// ======================================================

export const uploadTeacherDocument = (
  teacherId,
  formData
) => {
  return api.post(
    `/teachers/${teacherId}/documents`,
    formData
  );
};