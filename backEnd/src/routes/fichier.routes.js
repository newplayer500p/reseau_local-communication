// routes/route_file.js
import express from "express";
import fichierController from "../controllers/fichier.controller.js";
import uploadSingleFile from "../middlewars/saveFIleMiddleware.js";

const data_router = express.Router();

export const MiddlewareSaveFile = (req, res, next) => {
  uploadSingleFile(req, res, (err) => {
    if (err) {
      console.error("multer error:", err);
      const status = err.code === "LIMIT_FILE_SIZE" ? 413 : 400;
      return res.status(status).json({ ok: false, error: err.message || "Upload error" });
    }
    next(); // Passe au contrôleur suivant
  });
};

data_router.get("/", fichierController.getListFile);

data_router.post("/upload", MiddlewareSaveFile, fichierController.uploadFile);

data_router.delete("/:id", fichierController.deleteFile)

export default data_router;
