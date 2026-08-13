import api from "./api";

export const addHoliday = (data) => api.post("/holidays", data);
export const getHolidaysByYear = (year) => api.get(`/holidays/${year}`);
export const deleteHoliday = (id) => api.delete(`/holidays/${id}`);