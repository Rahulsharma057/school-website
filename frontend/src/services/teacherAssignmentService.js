import api from "./api";

// =====================================================
// ASSIGN TEACHER
// Body examples:
//   School: { teacherId, classId, subject, isClassTeacher }
//   College: { teacherId, programId, semester, subject }
// =====================================================

export const assignTeacher = (data) => {
  return api.post("/teacher-assignments", data);
};

export const getMyAssignments = () => {
  return api.get("/teacher-assignments/my-assignments");
};

export const getAllAssignments = (params) => {
  return api.get("/teacher-assignments", {
    params,
  });
};

export const updateAssignment = (id, data) => {
  return api.put(`/teacher-assignments/${id}`, data);
};

export const removeAssignment = (id) => {
  return api.put(`/teacher-assignments/${id}/remove`);
};