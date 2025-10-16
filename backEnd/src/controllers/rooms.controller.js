// controllers/rooms.controller.js  (version corrigée)
import * as roomService from "../service/room.service.js";
import { broadcastEvent } from "../utils/helperBroadcast.js";

export const onJoinRoom = async (req, res) => {
  try {
    const roomId = req.params.roomId;
    const { password = "" } = req.body; // clear
    // email should come from auth middleware: req.user.email
    const userEmail = req.user?.email || req.body?.email; // fallback if no auth
    const room = await roomService.joinRoom(roomId, password);
    return res.status(200).json({ ok: true, room });
  } catch (err) {
    console.log("err service joinRoom:", err);
    return res.status(400).json({ status: false, error: err.message });
  }
};

export const onCreateRoom = async (req, res) => {
  try {
    const data = req.body;
    if (!data)
      return res
        .status(400)
        .json({ status: false, message: "Aucun donnée reçu" });
    // Ensure createdBy is the authenticated user's email
    data.createdBy = req.user?.email || data.createdBy;
    const room = await roomService.createRoom(data);
    broadcastEvent(req.app, "rooms-changed", {
      action: "create",
      room: room,
    });
    return res.status(200).json({ ok: true, room });
  } catch (err) {
    console.log("err service createRoom:", err);
    return res.status(400).json({ status: false, error: err.message });
  }
};

export const onDeleteRoom = async (req, res) => {
  try {
    const roomId = req.params.roomId;
    const { password = "" } = req.body;
    const email = req.user?.email || req.body?.email;
    const attempt = await roomService.deleteRoom(email, roomId, password);
    broadcastEvent(req.app, "rooms-changed", {
      action: "delete",
      room: roomId,
    });
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.log("err service deleteRoom:", err);
    return res.status(400).json({ status: false, error: err.message });
  }
};

export const updateRoom = async (req, res) => {
  try {
    const roomId = req.params.roomId;
    const email = req.user?.email || req.body?.email;
    const { roomType, password = "" } = req.body;
    const room = await roomService.changeRoom(
      email,
      roomId,
      roomType,
      password
    );
    return res.status(200).json({ ok: true, room });
  } catch (err) {
    console.log("err service updateRoom:", err);
    return res.status(400).json({ status: false, error: err.message });
  }
};

export const listRoom = async (req, res) => {
  try {
    const roomList = await roomService.listRooms();
    return res.status(200).json({ ok: true, room: roomList });
  } catch (err) {
    console.log("err service listRoom:", err);
    return res.status(400).json({ status: false, error: err.message });
  }
};
