import api from "./api";

export const exportTeacherAttendance = (params) =>
  api.get("/export/attendance", { params, responseType: "blob" });

export const exportTeacherSalary = (params) =>
  api.get("/export/salary", { params, responseType: "blob" });