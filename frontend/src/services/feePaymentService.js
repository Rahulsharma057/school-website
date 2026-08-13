import api from "./api";

const BASE = "/fee-payments";

export const collectPayment = (studentFeeId, data) => api.post(`${BASE}/${studentFeeId}/collect`, data);
export const getPaymentHistory = (studentFeeId) => api.get(`${BASE}/${studentFeeId}/history`);
export const getAllPayments = (params) => api.get(`${BASE}/all`, { params });
export const getReceiptByNumber = (receiptNumber) => api.get(`${BASE}/receipt/${receiptNumber}`);