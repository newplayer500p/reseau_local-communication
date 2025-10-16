// scripts/createDefaultAdmin.js
import User from "../models/User.model.js";
import { hashPassword } from "./helperPassword.js";

export async function createDefaultAdmin() {
  try {
    const nom = process.env.ADMIN_NAME;
    const adminEmail = process.env.ADMIN_EMAIL;
    const plain = process.env.ADMIN_PASSWORD;
    const avatar = process.env.ADMIN_AVATAR;

    // Vérifie s'il existe déjà (par email ou par status Admin)
    const exists = await User.findOne({
      $or: [{ email: adminEmail }, { status: "Admin" }],
    });
    if (exists) {
      console.log("Admin déjà présent :", exists.email);
      return exists;
    }

    // Hash du mot de passe
    const hashed = await hashPassword(plain);

    // Création avec _id explicite
    const admin = new User({
      nom: nom,
      email: adminEmail,
      password: hashed,
      avatar: avatar,
      status: "Admin",
      description: "Compte Administrateur",
      isConnected: true,
      // v sera géré automatiquement par mongoose (versionKey: "v")
    });

    await admin.save();
    console.log("Admin créé :", admin.email);
    return admin;
  } catch (err) {
    console.error("Erreur création admin par défaut :", err);
    throw err;
  }
}
