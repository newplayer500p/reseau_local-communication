// models/fichier.model.js
import mongoose from "mongoose";

const TYPES = ["PDF", "TEXTE", "DOCX", "COMPRESSER", "VIDEO", "AUDIO", "IMAGE", "AUTRE"];

const FichierSchema = new mongoose.Schema({
  name: { type: String, required: true }, // nom donné par l'utilisateur (display name)
  originalName: { type: String, required: true }, // original filename with extension
  storedName: { type: String, required: true }, // filename on disk (Date.now()$@originalName)
  fileUrl: { type: String, required: true }, // path accessible, ex: /data/<storedName>
  type: { type: String, enum: TYPES, default: "AUTRE" },
  email: { type: String, required: true }, // email reference (string)
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }, // ObjectId ref to User (if found)
  author: { type: String, required: true }, // nom de l'auteur (récupéré depuis la collection User via email)
  size: { type: Number, required: true }, // bytes
  date: { type: String, required: true }, // YYYY-MM-DD
  heure: { type: String, required: true }, // HH:MM:SS
  description: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Fichier", FichierSchema);
export { TYPES };
