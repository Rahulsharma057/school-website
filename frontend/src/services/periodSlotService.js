import api from "./api";

export const createPeriodSlot = (data) => api.post("/period-slots", data);
export const getAllPeriodSlots = () => api.get("/period-slots");
export const updatePeriodSlot = (id, data) => api.patch(`/period-slots/${id}`, data);
export const deletePeriodSlot = (id) => api.delete(`/period-slots/${id}`);