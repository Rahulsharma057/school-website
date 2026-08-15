import api from "./api";

export const parseQuestionFile = (formData) =>
  api.post("/assessments/parse-file", formData, { headers: { "Content-Type": "multipart/form-data" } });

export const createAssessment = (data) => api.post("/assessments", data);
export const updateAssessmentStatus = (id, data) => api.patch(`/assessments/${id}/status`, data);
export const getMyAssessments = () => api.get("/assessments/my-assessments");
export const getAssessmentById = (id) => api.get(`/assessments/${id}`);
export const getMyClassAssessments = () => api.get("/assessments/my-class-assessments");

export const submitAssessment = (id, data) => api.post(`/assessments/${id}/submit`, data);
export const getMySubmission = (id) => api.get(`/assessments/${id}/my-submission`);

export const getSubmissionsForAssessment = (id) => api.get(`/assessments/${id}/submissions`);
export const getSubmissionById = (id) => api.get(`/assessments/submissions/${id}`);
export const gradeSubmission = (id, data) => api.patch(`/assessments/submissions/${id}/grade`, data);