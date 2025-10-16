import crypto from "crypto";
import jwt from "jsonwebtoken";

import refreshTokenModel from "../models/Token.model.js"; // ton modèle

const REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 jours



export async function generateAndStoreTokensForUser(user) {
  // Génère access token
  const accessToken = jwt.sign({ email: user.email }, process.env.JWT_SECRET, {
    expiresIn: "24h",
  });

  // Génère refresh token opaque
  const refreshTokenValue = crypto.randomBytes(64).toString("hex");

  // Stocke le refresh token en DB
  await refreshTokenModel.create({
    userEMail: user.email,
    token: refreshTokenValue,
    expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
    // tu peux ajouter createdByIp: ip si tu as le champ dans le schema
  });

  return {
    accessToken,
    refreshToken: refreshTokenValue,
  };
}

export function getEmailFromAccessToken(tokenB) {
  if (!tokenB) return null;

  const token = tokenB.split(" ")[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    // Assure-toi que le payload contient bien email (adaptable selon ce que tu signes)
    if (payload && typeof payload.email === "string") return payload.email;
    return null;
  } catch (err) {
    // token invalide, expiré, mal formé, etc.
    return null;
  }
}

// controllers/auth.controller.js
export const clearToken = async (token) => {
  try {
    const rt = await refreshTokenModel.findOne({ token });
    if (rt && !rt.revoked) {
      rt.revoked = new Date();
      rt.reason = "logout";
      await rt.save();
    }

    return true;
  } catch (err) {
    console.error("Logout error:", err);
    return false;
  }
};


export const CheckAndRefrechToken = async (token) => {
  const oldToken = await refreshTokenModel
    .findOne({ token })
    .populate("userEmail");

  const user = oldToken.userEMail;

  if (!oldToken || !oldToken.isActive) {
    await refreshTokenModel.updateMany(
      { userEMail: user.email, revoked: null },
      { revoked: new Date() }
    );

    return null;
  }

  // Révoquer l'ancien
  oldToken.revoked = new Date();
  await oldToken.save();

  // Générer nouveau access + refresh
  const tokenData = generateAndStoreTokensForUser(user)

  return(tokenData);
};