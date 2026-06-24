import axios from "axios";

const BASE = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const api = axios.create({ baseURL: BASE });

export const fetchDashboard = () => api.get("/dashboard").then((r) => r.data);
export const fetchResidents = (params) => api.get("/residents", { params }).then((r) => r.data);
export const fetchResident = (id) => api.get(`/residents/${id}`).then((r) => r.data);
export const createResident = (body) => api.post("/residents", body).then((r) => r.data);
export const toggleResident = (id) => api.post(`/residents/${id}/toggle`).then((r) => r.data);
export const fetchResidentsMin = () => api.get("/residents-min").then((r) => r.data);

export const fetchPasses = (params) => api.get("/passes", { params }).then((r) => r.data);
export const fetchExpiring = () => api.get("/passes/expiring").then((r) => r.data);
export const fetchPass = (id) => api.get(`/passes/${id}`).then((r) => r.data);
export const createPass = (body) => api.post("/passes", body).then((r) => r.data);
export const revokePass = (id) => api.post(`/passes/${id}/revoke`).then((r) => r.data);

export const verifyPin = (pin) => api.post("/verify", { pin }).then((r) => r.data);
export const approveEntry = (passId, guard) =>
  api.post(`/passes/${passId}/approve`, { pass_id: passId, guard }).then((r) => r.data);

export const fetchLogs = (params) => api.get("/logs", { params }).then((r) => r.data);
export const fetchReports = () => api.get("/reports").then((r) => r.data);
export const fetchSettings = () => api.get("/settings").then((r) => r.data);
export const updateSettings = (body) => api.put("/settings", body).then((r) => r.data);
