import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    nom: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    avatar: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: ["Utilisateur", "Responsable", "EnCours", "Admin"], // ✅ valeurs possibles
      default: "Utilisateur", // ✅ valeur par défaut si non précisé
    },
    description: {
      type: String,
      default: null,
    },
    isConnected: {
      type: Boolean,
      default: true,
    },
  },
  {
    versionKey: "v",
  }
);

export default mongoose.model("User", userSchema);
