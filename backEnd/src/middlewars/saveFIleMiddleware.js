// middlewares/saveFileMiddleware.js
import multer from "multer";
import fs from "fs";
import path from "path";

const MAX_BYTES = 5 * 1024 * 1024 * 1024; // 5 GB

const DATA_DIR = path.resolve(process.cwd(), "public", "data");

// ensure directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, DATA_DIR);
  },
  filename: (req, file, cb) => {
    // saved name: <timestamp>$@<originalname>
    const savedName = `${Date.now()}$@${file.originalname}`;
    cb(null, savedName);
  },
});

const fileFilter = (req, file, cb) => {
  // Optional: accept all types; controller/service will determine type/validation.
  cb(null, true);
};

export const uploadSingleFile = multer({
  storage,
  limits: { fileSize: MAX_BYTES },
  fileFilter,
}).single("file"); // expecting form field name "file"

export default uploadSingleFile;
