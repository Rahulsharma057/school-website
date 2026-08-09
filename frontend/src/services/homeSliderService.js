import api from "./api";


// ADMIN

export const getSliders = (params) =>
  api.get("/home-slider", { params });


export const getSlider = (id) =>
  api.get(`/home-slider/${id}`);


export const createSlider = (data) =>
  api.post("/home-slider", data);


export const updateSlider = (id, data) =>
  api.put(`/home-slider/${id}`, data);


export const deleteSlider = (id) =>
  api.delete(`/home-slider/${id}`);


export const updateSliderStatus = (id,status)=>
  api.patch(`/home-slider/${id}/status`,{
    status
  });


// PUBLIC

export const getPublicSliders = () =>
  api.get("/home-slider/public");