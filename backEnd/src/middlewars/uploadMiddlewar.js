// src/middlewars/uploads.middleware.js
import multer from "multer";
import path from "path";
import fs from "fs";

const PROJECT_ROOT = process.cwd(); // racine du projet à l'exécution
const UPLOAD_DIR = path.join(PROJECT_ROOT, "public", "upload");
const AVATAR_DIR = path.join(PROJECT_ROOT, "public", "avatars");

// s'assurer que les dossiers existent
fs.mkdirSync(UPLOAD_DIR, { recursive: true });
fs.mkdirSync(AVATAR_DIR, { recursive: true });

const storage_avatar = multer.diskStorage({
  destination: (req, file, cb) => cb(null, AVATAR_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}${ext}`);
  },
});
export const upload_avatar = multer({ storage: storage_avatar });

const storage_file = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const safeName = path.basename(file.originalname).replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, `${Date.now()}(!-!)${safeName}`);
  },
});
export const upload_file = multer({ storage: storage_file });
