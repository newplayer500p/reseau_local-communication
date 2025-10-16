// sockets/rooms.socket.js
import Room from "../models/Room.model.js";
import { addPresence, removePresence, isPresent } from "./presenceManager.js";
import {
  sendMessage as saveMessageService,
  listMessages,
} from "../service/message.service.js";

export function initRoomSockets(io) {
  io.on("connection", (socket) => {
    const email = socket.userEmail; // set by io middleware
    console.log(`Socket connected for ${email} (${socket.id})`);

    // Join room
    socket.on("join_room", async ({ roomId, password } = {}, ack) => {
      try {
        if (!roomId) throw new Error("roomId requis");
        const room = await Room.findOne({ id: roomId });
        if (!room) throw new Error("Salle introuvable");

        // vérifier le mot de passe AVANT tout
        const ok = await room.checkPassword(password || "");
        if (!ok) throw new Error("Mot de passe incorrect");

        socket.join(roomId);
        addPresence(roomId, email);

        console.log(
          `[join_room] socket ${socket.id} (${email}) joined ${roomId}`
        );
        console.log(
          "members now:",
          Array.from(io.sockets.adapter.rooms.get(roomId) || [])
        );

        // Send last 50 messages
        const history = await listMessages(roomId, { limit: 50 });
        socket.emit("room_history", history);

        // Notify others presence
        socket
          .to(roomId)
          .emit("presence_update", { roomId, email, action: "join" });

        // ack final
        if (ack) ack({ ok: true, room: roomId });
      } catch (err) {
        if (ack) ack({ ok: false, error: err.message });
      }
    });

    // Leave room
    socket.on("leave_room", ({ roomId } = {}, ack) => {
      try {
        socket.leave(roomId);
        removePresence(roomId, email);
        socket
          .to(roomId)
          .emit("presence_update", { roomId, email, action: "leave" });
        if (ack) ack({ ok: true });
      } catch (err) {
        if (ack) ack({ ok: false, error: err.message });
      }
    });

    // Send message (text or file metadata)
    socket.on("send_message", async (payload = {}, ack) => {
      try {
        const { roomId, type, text, file } = payload;
        console.log(payload);

        if (!roomId) throw new Error("roomId requis");
        // verify presence in room
        if (!isPresent(roomId, email))
          throw new Error("Vous n'êtes pas dans la salle");
        // Save message (service verifies fields)
        const msg = await saveMessageService({
          room: roomId,
          sender: email,
          type,
          text,
          file,
        });

        const members = Array.from(io.sockets.adapter.rooms.get(roomId) || []);
        console.log(
          `[send_message] emitting to room ${roomId}, members:`,
          members
        );
        io.to(roomId).emit("room_message", msg);

        // broadcast to room
        io.to(roomId).emit("room_message", msg);
        if (ack) ack({ ok: true, message: msg });
      } catch (err) {
        if (ack) ack({ ok: false, error: err.message });
      }
    });
    
    // Typing indicator
    socket.on("typing", ({ roomId, isTyping = true } = {}) => {
      if (!roomId) return;
      socket.to(roomId).emit("typing", { roomId, email, isTyping });
    });

    // On disconnect: remove from all rooms presence
    socket.on("disconnect", () => {
      // remove presence from all rooms user was present in
      const roomsJoined = Array.from(socket.rooms).filter(
        (r) => r !== socket.id
      );
      roomsJoined.forEach((r) => {
        removePresence(r, email);
        socket
          .to(r)
          .emit("presence_update", { roomId: r, email, action: "leave" });
      });
      console.log(`Socket disconnected for ${email}`);
    });
  });
}
