// service/evenement.service.jsx
import { api } from "./axios.service";

export const evenementService = {
  getAnonce: () => api.get("/evenement"),
  createAnnonce: (payload) => api.post("/evenement", payload),
  deleteAnonce: (id) => api.delete(`/evenement/${id}`)
};
