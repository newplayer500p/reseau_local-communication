// controllers/message.controller.js
import { sendMessage, listMessages } from '../service/message.service.js';
import Room from '../models/Room.model.js';

// GET /api/rooms/:roomId/messages
export const getMessages = async (req, res) => {
  try {
    const roomId = req.params.roomId;
    const { before, limit } = req.query;
    // optional: verify room exists
    const room = await Room.findOne({ id: roomId });
    if (!room) return res.status(404).json({ error: 'Salle introuvable' });

    const msgs = await listMessages(roomId, { limit: Number(limit) || 50, before: before || null });
    return res.json(msgs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// POST /api/rooms/:roomId/messages  (fallback HTTP send)
export const postMessage = async (req, res) => {
  try {
    const roomId = req.params.roomId;
    const { type = 'text', text = '', file = null } = req.body;
    const email = req.user?.email; // from auth middleware
    if (!email) return res.status(401).json({ error: 'Non authentifié' });

    // verify presence in room (presenceManager)
    // import presenceManager lazily to avoid circular
    const { isPresent } = await import('../sockets/presenceManager.js');
    if (!isPresent(roomId, email)) return res.status(403).json({ error: "Vous n'êtes pas dans la salle" });

    const msg = await sendMessage({ room: roomId, sender: email, type, text, file });
    // Optionally broadcast via io => we need access to io, one pattern is to attach io to app.locals.io in server init
    const io = req.app.locals.io;
    if (io) io.to(roomId).emit('room_message', msg);

    return res.status(201).json(msg);
  } catch (err) {
    console.error(err);
    return res.status(400).json({ error: err.message });
  }
};

// controllers/message.controller.js
export const uploadFileHandler = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ ok: false, error: "No file" });

    const { roomId } = req.params;
    const email = req.email;

    const fileUrl = `${req.protocol}://${req.get('host')}/public/upload/${req.file.filename}`;

    // Utilisez le service qui sauvegarde en BDD
    const savedMsg = await sendMessage({
      room: roomId,
      type: "file",
      file: {
        url: fileUrl,
        name: req.file.originalname,
        size: req.file.size
      },
      sender: email,
      text: "" // ou description optionnelle
    });

    // Broadcast
    const io = req.app?.locals?.io;
    if (io) io.to(roomId).emit("room_message", savedMsg);

    return res.json({ ok: true, message: savedMsg });
  } catch (err) {
    console.error("upload error", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
};