import api from "./api";

export const markTeacherAttendance = (data) => api.post("/teacher-attendance/mark", data);

export const getTeacherAttendanceByMonth = (params) =>
  api.get("/teacher-attendance", { params });