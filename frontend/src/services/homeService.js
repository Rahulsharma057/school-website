import api from "./api";

export const createSlider = (data) => {
  return api.post("/home-slider", data, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};
export const getSingleSlider = (id) => {
  return api.get(`/home-slider/${id}`);
};
export const getSliders = () => {
  return api.get("/home-slider");
};
export const updateSlider = (id, data) => {
  return api.put(`/home-slider/${id}`, data);
};
export const updateSliderStatus = (id, status) =>
  api.patch(`/home-slider/${id}/status`, {
    status,
  });
export const deleteSlider = (id) => {
  return api.delete(`/home-slider/${id}`);
};
