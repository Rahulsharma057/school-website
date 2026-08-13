import api from "./api";

export const getAllClasses = () => {
  return api.get("/classes");
};

export const createClass = (data) => {
  return api.post("/classes", data);
};

export const updateClass = (id, data) => {
  return api.patch(`/classes/${id}`, data);
};

export const deleteClass = (id) => {
  return api.delete(`/classes/${id}`);
};