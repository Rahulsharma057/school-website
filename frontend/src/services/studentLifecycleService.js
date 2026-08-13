import api from "./api";

export const markStudentLeft = (studentProfileId, reason) => {
  return api.patch(`/student-lifecycle/${studentProfileId}/mark-left`, { reason });
};

export const reactivateStudent = (studentProfileId) => {
  return api.patch(`/student-lifecycle/${studentProfileId}/reactivate`);
};

export const getLeftStudents = () => {
  return api.get("/student-lifecycle/left");
};