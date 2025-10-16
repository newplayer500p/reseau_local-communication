// services/fichier.service.js
import fs from "fs/promises";
import path from "path";
import Fichier, { TYPES } from "../models/Fichier.model.js";
import User from "../models/User.model.js"; // j'assume que ce modèle existe

const DATA_DIR = path.resolve(process.cwd(), "public", "data");
const MAX_BYTES = 5 * 1024 * 1024 * 1024; // 5 GB

async function saveFile({ file, body, uploaderEmail }) {
  // file: req.file (multer)
  // body: req.body (name, description, type optional)
  // uploaderEmail: req.email
  if (!file) throw new Error("No file provided");

  const { filename: storedName, originalname } = file;
  const filePath = path.join(DATA_DIR, storedName);

  // double-check size limit
  if (file.size > MAX_BYTES) {
    // remove the uploaded file
    await fs.unlink(filePath).catch(() => {});
    const err = new Error("File too large (max 5GB)");
    err.status = 413;
    throw err;
  }

  // lookup user by email to set user and author
  let userDoc = null;
  let authorName = uploaderEmail;
  try {
    userDoc = await User.findOne({ email: uploaderEmail })
      .select("name email")
      .lean();
    if (userDoc && userDoc.nom) {
      authorName = userDoc.nom;
    }
  } catch (e) {
    // ignore: authorName stays uploaderEmail
  }

  // compute date & heure
  const d = new Date();
  const dateStr = d.toISOString().slice(0, 10); // YYYY-MM-DD
  const timeStr = d.toTimeString().split(" ")[0]; // HH:MM:SS

  const doc = new Fichier({
    name: body.name || originalname,
    originalName: originalname,
    storedName,
    fileUrl: `/data/${storedName}`, // path to serve (assumes express.static('public'))
    type: body.type,
    email: uploaderEmail,
    user: userDoc ? userDoc._id : null,
    author: authorName,
    size: file.size,
    date: dateStr,
    heure: timeStr,
    description: body.description || "",
  });

  await doc.save();
  return doc.toObject();
}

async function getFileByName(name) {
  return Fichier.findOne({storedName : name}).lean();
}

async function getFileById(id) {
  return Fichier.findById(id).lean();
}

export async function deleteFileById(id) {
  // 1) chercher la doc
  const doc = await Fichier.findById(id);
  if (!doc) return null;

  const filePath = path.join(DATA_DIR, doc.storedName);

  // 2) supprimer le fichier (ignorer ENOENT)
  try {
    await fs.unlink(filePath);
  } catch (err) {
    if (err.code !== "ENOENT") throw err; // si erreur autre que "fichier pas trouvé", remonter l'erreur
  }

  // 3) supprimer la doc dans la DB — utilise findByIdAndDelete pour être sûr
  const deleted = await Fichier.findByIdAndDelete(id);
  return deleted ? deleted.toObject() : null;
}

// services/fichier.service.js

async function getAllFiles({ limit = 50, skip = 0 } = {}) {
  // On récupère tous les fichiers, triés par date descendante (les plus récents d'abord)
  // et on "populate" l'utilisateur pour avoir son nom/email si nécessaire
  const files = await Fichier.find()
    .sort({ date: -1, heure: -1 }) // trier par date puis heure
    .skip(skip)
    .limit(limit)
    .populate({
      path: "user",
      select: "nom email", // champs que tu veux récupérer de User
    })
    .lean();

  return files;
}

export default {
  saveFile,
  getFileByName,
  getFileById,
  deleteFileById,
  getAllFiles, // <-- ajout ici
};
