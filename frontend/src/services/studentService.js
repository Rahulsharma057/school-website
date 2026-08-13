import api from "./api";

// CREATE STUDENT (Principal/Admin)
export const createStudent = (data) => {
  return api.post("/students", data);
};

// STUDENT — apna profile
export const getMyStudentProfile = () => {
  return api.get("/students/my-profile");
};

export const getStudentsByClass = (classId) => {
  return api.get(`/students/by-class/${classId}`);
};
export const getStudentFeeByStudentId = (studentId) => api.get(`/student-fees/by-student/${studentId}`);