import api from "./api";

export const createTimetableEntry = (data) => api.post("/timetable", data);
export const updateTimetableEntry = (id, data) => api.patch(`/timetable/${id}`, data);
export const deleteTimetableEntry = (id) => api.delete(`/timetable/${id}`);
export const getClassTimetable = (classId) => api.get(`/timetable/class/${classId}`);
export const getMyTimetable = () => api.get("/timetable/my-timetable");
export const getMyClassTimetable = () => api.get("/timetable/my-class-timetable");