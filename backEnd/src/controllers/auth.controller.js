import { creatUser, checkIsUser } from "../service/user.service.js";
import {
  CheckAndRefrechToken,
  clearToken,
  generateAndStoreTokensForUser,
} from "../utils/helperToken.js";
import fs from "fs";
import path from "path";
import jwt from 'jsonwebtoken';

export const sign_up = async (req, res, next) => {
  
  try {
    const avatar = req.file;
    const userData = req.body;

    const user = await creatUser(userData, avatar.path);

    if (user === null){
      fs.unlink(path.join(avatar.path), (err) => {
        if (err) console.error("Erreur suppression avatar :", err);
      });
      return res
        .status(404)
        .json({message: "Un erreur est survenue; verifier si les champs sont complet"});
    }

    const tokenData = await generateAndStoreTokensForUser(user);

    res.cookie("refreshToken", tokenData.refreshToken, {
      httpOnly: true,
      sameSite: "Lax",
      maxAge: 30 * 24 * 60 * 60 * 1000,
      path: "/",
    });

    console.log(tokenData.accessToken);

    return res.status(200).json(tokenData.accessToken);
  } catch (err) {
    fs.unlink(path.join(avatar.path), (err) => {
      if (err) console.error("Erreur suppression avatar :", err);
    });
    console.log(err);
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await checkIsUser(email, password);

    if (user === null) return res.sendStatus(404);

    const tokenData = await generateAndStoreTokensForUser(user);

    res.cookie("refreshToken", tokenData.refreshToken, {
      httpOnly: true,
      sameSite: "Lax",
      maxAge: 30 * 24 * 60 * 60 * 1000,
      path: "/",
    });

    return res.status(200).json(tokenData.accessToken);
  } catch (err) {
    next(err);
  }
};

export const logout = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) return res.status(500).send("Token requis");


    const attempt = await clearToken(token);
    if (attempt){
      res.clearCookie("refreshToken", {
        httpOnly: true,
        sameSite: "Lax",
        path: "/",
      });

      return res.sendStatus(200);
    }
    else return res.status(500).send("Un erreur est survenue du serveur");
  } catch (err) {
    next(err);
  }
};

// côté serveur (express)
export const refresh = async (req, res) => {
  // prefère le cookie si présent, sinon fallback sur req.body.token
  const token = req.cookies?.refreshToken || req.body?.token;
  if (!token) return res.status(401).json({ message: "Refresh token manquant" });

  const tokenData = await CheckAndRefrechToken(token);
  if (!tokenData) return res.status(401).json({ message: "Refresh token invalide ou expiré" });

  res.cookie("refreshToken", tokenData.refreshToken, {
    httpOnly: true,
    sameSite: "Lax", // ou "None" + secure: true en prod cross-site
    maxAge: 30 * 24 * 60 * 60 * 1000,
    path: "/",
  });

  return res.status(200).json({ accessToken: tokenData.accessToken });
};

export const getSocketToken = async (req, res) => {
  try {
    // req.user est rempli par ton authMiddleware
    const authHeader = req.headers.authorization;

    if (!authHeader) return res.status(401).json({ error: "Token manquant" });

    
    const token = authHeader.split(" ")[1];

    const payload = jwt.verify(token, process.env.JWT_SECRET);

    const socketToken = jwt.sign(
      { email: payload.email },
      process.env.SOCKET_JWT_SECRET,
      { expiresIn: "24h" }
    );

    return res.status(200).json({ token: socketToken });
  } catch (err) {
    console.error("Erreur getSocketToken:", err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
};