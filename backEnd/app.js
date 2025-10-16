import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import authMiddleWare from "./src/middlewars/authMiddleware.js";
import userRouter from "./src/routes/user.routes.js";
import authRouter from "./src/routes/auth.routes.js";
import roomRoute from "./src/routes/room.routes.js";
import messageRoute from "./src/routes/message.route.js";

import cookieParser from "cookie-parser";
import dataRoute from "./src/routes/fichier.routes.js";
import fichierController from "./src/controllers/fichier.controller.js";
import eventRoute from "./src/routes/evente.route.js";
import {getQuiz} from "./src/controllers/quiz.controller.js"
import evenementRouter from "./src/routes/evenement.route.js";

const __dirname = import.meta.dirname;
const app = express();
const UPLOAD_DIR = path.join(__dirname, "public", "upload");

app.locals.sseClients = [];

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));

app.use(express.json());
app.use(cookieParser()); // <-- permet de parser les cookies

app.use("/public", express.static(path.join(__dirname, "public")));

app.get("/data/:id", fichierController.downloadFile);

app.get("/api/quiz", getQuiz);

app.get("/download/:filename", (req, res) => {
  const safe = path.basename(req.params.filename); // prévenir path traversal
  const filePath = path.join(UPLOAD_DIR, safe);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile())
      return res.status(404).send("Fichier introuvable");

    const total = stats.size;
    const range = req.headers.range;
    const contentType = mime.getType(filePath) || "application/octet-stream";

    res.setHeader("Accept-Ranges", "bytes");
    res.setHeader("Content-Type", contentType);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${path.basename(filePath)}"`
    );

    let start = 0;
    let end = total - 1;
    let statusCode = 200;

    if (range) {
      // ex: "bytes=123-"
      const match = /bytes=(\d*)-(\d*)/.exec(range);
      if (match) {
        const rs = match[1] ? parseInt(match[1], 10) : 0;
        const re = match[2] ? parseInt(match[2], 10) : end;
        if (rs <= re && rs >= 0 && re < total) {
          start = rs;
          end = re;
          statusCode = 206;
        } else {
          res.setHeader("Content-Range", `bytes */${total}`);
          return res.status(416).send("Range non satisfiable");
        }
      }
    }

    res.status(statusCode);
    res.setHeader("Content-Length", end - start + 1);
    if (statusCode === 206)
      res.setHeader("Content-Range", `bytes ${start}-${end}/${total}`);

    const fileStream = fs.createReadStream(filePath, { start, end });

    // si le client coupe la connexion, détruire le stream
    const onClose = () => {
      fileStream.destroy();
    };

    req.on("close", onClose);

    pipeline(fileStream, res, (streamErr) => {
      req.off("close", onClose);
      if (streamErr) {
        // Erreurs communes : abort by client, EPIPE
        console.error("download stream error", streamErr);
      }
    });
  });
});

app.use("/auth", authRouter);
app.use("/user", authMiddleWare, userRouter);
app.use("/room", authMiddleWare, roomRoute);
app.use("/message", authMiddleWare, messageRoute);
app.use("/file", authMiddleWare, dataRoute);
app.use("/evenement", authMiddleWare, evenementRouter)
app.use("/events", eventRoute(app));

export default app;
