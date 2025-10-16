import multer from 'multer';
import path from 'path';

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/avatars'); // Dossier où les avatars seront stockés
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext); // Nom unique basé sur le timestamp
  }
});

const upload = multer({ storage: storage });

export default upload;