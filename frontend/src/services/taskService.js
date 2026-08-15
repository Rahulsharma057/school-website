import api from "./api";

export const createTask = (data) => api.post("/tasks", data);
export const getAllTasks = (params) => api.get("/tasks", { params });
export const getMyTasks = (params) => api.get("/tasks/my-tasks", { params });
export const getTaskById = (id) => api.get(`/tasks/${id}`);
export const updateTaskStatus = (id, data) => api.patch(`/tasks/${id}/status`, data);
export const addTaskMessage = (id, data) => api.post(`/tasks/${id}/messages`, data);
export const deleteTask = (id) => api.delete(`/tasks/${id}`);
export const getTaskStats = () => api.get("/tasks/stats");