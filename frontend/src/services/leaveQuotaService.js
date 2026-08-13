import api from "./api";

export const setLeaveQuota = (data) => api.post("/leave-quota", data);
export const getLeaveQuota = (teacherId, year) => api.get(`/leave-quota/${teacherId}/${year}`);