import api from "./api";

export const applyLeave = (data) => api.post("/leave-requests/apply", data);
export const getMyLeaveRequests = () => api.get("/leave-requests/my-requests");
export const getAllLeaveRequests = (params) => api.get("/leave-requests", { params });
export const reviewLeaveRequest = (id, data) => api.patch(`/leave-requests/${id}/review`, data);