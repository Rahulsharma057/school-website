import api from "./api";

export const markAttendance = (data) => {
  return api.post("/attendance/mark", data);
};

export const updateAttendance = (data) => {
  return api.patch("/attendance/update", data);
};

export const getClassAttendance = (classId, date) => {
  return api.get("/attendance/class", {
    params: {
      classId,
      date,
    },
  });
};

export const getStudentAttendance = (studentId, classId, from, to) => {
  return api.get(`/attendance/student/${studentId}`, {
    params: {
      classId,
      ...(from ? { from } : {}),
      ...(to ? { to } : {}),
    },
  });
};

export const getMyAttendance = () => {
  return api.get("/attendance/my-attendance");
};
