import api from "./api";

export const assignTeacher = (data) => {
  return api.post("/teacher-assignments", data);
};

export const getMyAssignments = () => {
  return api.get("/teacher-assignments/my-assignments");
};

export const getAllAssignments = (params) => {
  return api.get("/teacher-assignments", { params });
};

export const removeAssignment = (id) => {
  return api.patch(`/teacher-assignments/${id}/remove`);
};