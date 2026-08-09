import api from "./api";
export const registerUser = (data)=>{
    return api.post(
        "/auth/register",
        data
    );
};
export const loginUser = (data) => {
  return api.post("/auth/login", data);
};



export const logoutUser = () => {
  return api.post("/auth/logout");
};
export const getProfile = () =>
  api.get("/users/profile");
