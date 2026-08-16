import api from "./api";

export const createGroup = (data) => api.post("/chat/groups", data);
export const getMyGroups = () => api.get("/chat/groups/my-groups");
export const getAllGroups = () => api.get("/chat/groups");
export const getMemberOptions = () => api.get("/chat/groups/member-options");
export const toggleMediaUpload = (id, allowMediaUpload) =>
  api.patch(`/chat/groups/${id}/media-toggle`, { allowMediaUpload });
export const deleteGroup = (id) => api.delete(`/chat/groups/${id}`);

export const getMessages = (groupId, before) =>
  api.get(`/chat/groups/${groupId}/messages`, { params: before ? { before } : {} });
export const sendMessage = (groupId, data) => api.post(`/chat/groups/${groupId}/messages`, data);