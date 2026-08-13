import api from "./api";

export const setSalaryStructure = (data) => api.post("/salary/structure", data);

export const getCurrentSalaryStructure = (teacherId) =>
  api.get(`/salary/structure/${teacherId}`);

export const generateMonthlySalary = (data) => api.post("/salary/generate", data);

export const addPayment = (id, data) => api.patch(`/salary/${id}/pay`, data);

export const getTeacherSalaryHistory = (teacherId) =>
  api.get(`/salary/history/${teacherId}`);

export const getMySalary = () => api.get("/salary/my-salary");