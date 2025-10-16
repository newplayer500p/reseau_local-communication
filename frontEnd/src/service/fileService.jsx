// service/file.service.js
import { api, API_BASE } from "./axios.service";

export const fileService = {
  uploadFile: (formData) =>
    api.post("/file/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  getFiles: () => api.get("/file"),
  deleteFile: (id) => api.delete(`/file/${id}`),
  downloadFile: (storedName) =>
    `${API_BASE}/data/${encodeURIComponent(storedName)}`,
};

