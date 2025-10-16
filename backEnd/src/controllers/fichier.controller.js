// controllers/fichier.controller.js
import path from "path";
import fs from "fs";
import { pipeline } from "stream";
import fileService from "../service/fichier.service.js";
import { broadcastEvent } from "../utils/helperBroadcast.js";

const DATA_DIR = path.resolve(process.cwd(), "public", "data");

async function uploadFile(req, res) {
  try {
    const uploaderEmail = req.email;
    if (!uploaderEmail)
      return res
        .status(401)
        .json({ error: "Email absent dans la requête (auth)." });

    if (!req.file)
      return res
        .status(400)
        .json({ error: "Aucun fichier reçu. Champ attendu: 'file'." });

    const saved = await fileService.saveFile({
      file: req.file,
      body: req.body,
      uploaderEmail,
    });

    // Répondre d'abord au client
    res.status(201).json({ ok: true, file: saved });

    // Diffuser l'événement à TOUS les clients
    if (req.app && req.app.locals && req.app.locals.sseClients) {
      const message = `event: files-changed\ndata: ${JSON.stringify({
        action: "upload",
        id: saved._id,
      })}\n\n`;

      req.app.locals.sseClients.forEach((client) => {
        try {
          client.res.write(message);
        } catch (error) {
          // Supprimer les clients déconnectés
          req.app.locals.sseClients = req.app.locals.sseClients.filter(
            (c) => c.id !== client.id
          );
        }
      });
    }
  } catch (err) {
    console.error("uploadFile error:", err);
    const status = err.status || 500;
    return res
      .status(status)
      .json({ ok: false, error: err.message || "Erreur serveur" });
  }
}

async function deleteFile(req, res) {
  try {
    const uploaderEmail = req.email;
    const fileId = req.params.id;
    if (!fileId) return res.status(400).json({ error: "Missing file id" });

    const fileDoc = await fileService.getFileById(fileId);
    if (!fileDoc) return res.status(404).json({ error: "Fichier introuvable" });

    const adminEmail = process.env.ADMIN_EMAIL;
    if (fileDoc.email !== uploaderEmail && uploaderEmail !== adminEmail) {
      return res
        .status(403)
        .json({
          error: "Vous n'avez pas la permission de supprimer ce fichier",
        });
    }

    const deleted = await fileService.deleteFileById(fileId);

    // Répondre d'abord au client
    res.json({ ok: true, deleted });

    // Diffuser l'événement à TOUS les clients
    if (req.app && req.app.locals && req.app.locals.sseClients) {
      const message = `event: files-changed\ndata: ${JSON.stringify({
        action: "delete",
        id: fileId,
      })}\n\n`;

      req.app.locals.sseClients.forEach((client) => {
        try {
          client.res.write(message);
        } catch (error) {
          // Supprimer les clients déconnectés
          req.app.locals.sseClients = req.app.locals.sseClients.filter(
            (c) => c.id !== client.id
          );
        }
      });
    }
  } catch (err) {
    console.error("deleteFile error:", err);
    return res
      .status(500)
      .json({ ok: false, error: err.message || "Erreur serveur" });
  }
}

export async function downloadFile(req, res) {
  try {
    // decode + sanitize param (évite les espaces/!/@ non encodés et path traversal)
    const raw = req.params.id || "";
    const safeName = path.basename(decodeURIComponent(raw));

    console.log("download request for:", safeName);

    const fileDoc = await fileService.getFileByName(safeName);
    if (!fileDoc) return res.status(404).json({ error: "Fichier introuvable" });

    const filePath = path.join(DATA_DIR, fileDoc.storedName);

    // vérif physique
    let stats;
    try {
      stats = await fs.promises.stat(filePath);
      if (!stats.isFile()) throw new Error("Not a file");
    } catch (e) {
      return res.status(404).json({ error: "Fichier physique introuvable" });
    }

    const total = stats.size;
    const range = req.headers.range;

    let start = 0;
    let end = total - 1;
    let statusCode = 200;

    if (range) {
      // range: "bytes=123-456" ou "bytes=123-"
      const match = /bytes=(\d*)-(\d*)/.exec(range);
      if (match) {
        const rs = match[1] ? parseInt(match[1], 10) : 0;
        const re = match[2] ? parseInt(match[2], 10) : end;
        // validate
        if (
          !Number.isNaN(rs) &&
          !Number.isNaN(re) &&
          rs <= re &&
          rs >= 0 &&
          re < total
        ) {
          start = rs;
          end = re;
          statusCode = 206;
        } else {
          res.setHeader("Content-Range", `bytes */${total}`);
          return res.status(416).send("Range non satisfiable");
        }
      }
    }

    const contentType = "application/octet-stream"; // ou mime.getType(...)
    res.status(statusCode);
    res.setHeader("Accept-Ranges", "bytes");
    res.setHeader("Content-Type", contentType);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${fileDoc.originalName}"`
    );
    res.setHeader("Content-Length", end - start + 1);
    if (statusCode === 206) {
      res.setHeader("Content-Range", `bytes ${start}-${end}/${total}`);
    }

    const fileStream = fs.createReadStream(filePath, { start, end });

    // si client coupe, détruire le stream
    const onClose = () => {
      try {
        fileStream.destroy();
      } catch (e) {}
    };
    req.on("close", onClose);
    req.on("aborted", onClose);

    // pipe avec gestion d'erreur propre
    pipeline(fileStream, res, (err) => {
      req.off("close", onClose);
      req.off("aborted", onClose);
      if (err) {
        // erreurs courantes à ignorer : connexion interrompue par client
        if (
          err.code === "ERR_STREAM_PREMATURE_CLOSE" ||
          err.code === "ECONNABORTED"
        ) {
          console.log("download aborted by client (normal):", safeName);
          return;
        }
        // log utile pour autres erreurs
        console.error("download error:", err);
      } else {
        // succes (tous les segments nécéssitent des logs si tu veux)
        // console.log("download finished:", safeName);
      }
    });
  } catch (err) {
    console.error("downloadFile error:", err);
    return res.status(500).json({ error: err.message || "Erreur serveur" });
  }
}

async function getListFile(req, res) {
  try {
    // pagination optionnelle via query params
    const limit = parseInt(req.query.limit) || 50;
    const skip = parseInt(req.query.skip) || 0;

    const files = await fileService.getAllFiles({ limit, skip });

    return res.json({ ok: true, files });
  } catch (err) {
    console.error("getListFile error:", err);
    return res
      .status(500)
      .json({ ok: false, error: err.message || "Erreur serveur" });
  }
}

export default {
  uploadFile,
  deleteFile,
  downloadFile,
  getListFile,
};
