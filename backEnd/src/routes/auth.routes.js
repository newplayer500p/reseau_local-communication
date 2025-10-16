import express from 'express';
import { getSocketToken, login, logout, refresh, sign_up } from '../controllers/auth.controller.js';
import upload from '../middlewars/multerMiddlewar.js';
import authMiddleWare from '../middlewars/authMiddleware.js';

const router_auth = express.Router();

router_auth.post("/login", login);
router_auth.put("/sign_up", upload.single("avatar"), sign_up);
router_auth.post("/refresh", refresh);
router_auth.delete("/logout", logout);
router_auth.get("/socket-token", getSocketToken);

export default router_auth;