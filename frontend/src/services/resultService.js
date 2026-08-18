import api from "./api";

export const enterResult = (data) => {
  return api.post("/results/enter", data);
};

export const getMyResults = () => {
  return api.get("/results/my-results");
};

export const getClassResults = (examId) => {
  return api.get(`/results/exam/${examId}`);
};

export const downloadResultTemplate = (examId) =>
  api.get(`/results/template/${examId}`, { responseType: "blob" });

export const bulkEnterResults = (data) => api.post("/results/bulk", data);