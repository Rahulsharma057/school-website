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