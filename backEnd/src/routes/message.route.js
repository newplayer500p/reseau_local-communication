// routes/messages.routes.js
import express from "express";
import * as MessageCtrl from "../controllers/messages.controller.js";
import verifyToken from "../middlewars/authMiddleware.js"; // ton middleware d'auth qui remplit req.user
import { upload_file } from "../middlewars/uploadMiddlewar.js";

const router_message = express.Router({ mergeParams: true });

// list messages
router_message.get("/:roomId", verifyToken, MessageCtrl.getMessages);

// send via HTTP
router_message.post("/:roomId", verifyToken, MessageCtrl.postMessage);

// upload
router_message.post("/:roomId/upload", upload_file.single("file"), MessageCtrl.uploadFileHandler);

export default router_message;
