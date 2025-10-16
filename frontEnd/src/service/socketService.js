// socketService.js
import { io } from "socket.io-client";

class SocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.eventHandlers = new Map(); // event -> Set(callback)
    this.internalHandlers = new Map();
    this.joinedRooms = new Map(); // roomId -> { password }
    this.connectionPromise = null;
  }

  _attachStoredHandlers() {
    if (!this.socket) return;
    for (const [event, callbacks] of this.eventHandlers.entries()) {
      callbacks.forEach((cb) => {
        this.socket.off(event, cb);
        this.socket.on(event, cb);
      });
    }
  }

  _emitInternal(event, data) {
    const s = this.internalHandlers.get(event) || new Set();
    s.forEach((cb) => {
      try { cb(data); } catch (e) { console.error("internal handler error", e); }
    });
  }

  // joinRoom helper : UTILISEZ-CELA dans votre UI pour joiner
  joinRoom(roomId, password = "", cb) {
    if (!this.socket || !this.connected) {
      console.warn("socket not connected - cannot join");
      if (cb) cb({ ok: false, error: "not_connected" });
      return;
    }
    this.socket.emit("join_room", { roomId, password }, (ack) => {
      console.log("[socketService] join_room ack for", roomId, ack);
      if (ack?.ok) {
        // store password so we can rejoin on reconnect
        this.joinedRooms.set(roomId, { password });
      } else {
        // ensure not stored
        this.joinedRooms.delete(roomId);
      }
      if (typeof cb === "function") cb(ack);
    });
  }

  async connect({ url, accessToken, reconnectionAttempts = 5 } = {}) {
    if (this.connectionPromise) return this.connectionPromise;

    this.connectionPromise = new Promise((resolve, reject) => {
      if (this.socket) this.disconnect();

      console.log("[socketService] connecting...", { url });

      this.socket = io(url, {
        auth: { token: accessToken },
        transports: ["websocket", "polling"],
        timeout: 15000,
        reconnectionAttempts,
        reconnectionDelay: 2000,
        autoConnect: true,
      });

      const timeout = setTimeout(() => {
        console.warn("[socketService] connect timeout");
        this.cleanup();
        reject(new Error("Connection timeout"));
      }, 15000);

      this.socket.on("connect", () => {
        clearTimeout(timeout);
        this.connected = true;
        console.log("[socketService] connected", this.socket.id);

        // ré-attacher handlers
        this._attachStoredHandlers();

        // rejoin using stored passwords
        for (const [roomId, meta] of this.joinedRooms.entries()) {
          console.log("[socketService] rejoin attempt for", roomId);
          this.socket.emit("join_room", { roomId, password: meta.password || "" }, (ack) => {
            console.log("[socketService] join_room ack for", roomId, ack);
            if (!ack?.ok) {
              console.warn("[socketService] rejoin failed for", roomId, ack?.error);
              this.joinedRooms.delete(roomId);
            } else {
              // ok, keep in map
            }
          });
        }

        this._emitInternal("connected", this.socket.id);
        resolve(this.socket);
      });

      this.socket.on("disconnect", (reason) => {
        this.connected = false;
        console.log("[socketService] disconnected:", reason);
        this._emitInternal("disconnected", reason);
      });

      this.socket.on("connect_error", (err) => {
        console.error("[socketService] connect_error:", err);
        this._emitInternal("error", err);
        clearTimeout(timeout);
        reject(err);
      });

      this.socket.on("error", (err) => {
        console.error("[socketService] error:", err);
        this._emitInternal("error", err);
      });
    });

    return this.connectionPromise;
  }

  cleanup() {
    if (!this.socket) return;
    try {
      this.socket.removeAllListeners();
      this.socket.disconnect();
    } catch (e) {
      console.warn("cleanup error", e);
    } finally {
      this.socket = null;
      this.connected = false;
      this.connectionPromise = null;
    }
  }

  disconnect() {
    this.cleanup();
  }

  on(event, cb) {
    if (!this.eventHandlers.has(event)) this.eventHandlers.set(event, new Set());
    this.eventHandlers.get(event).add(cb);
    if (this.socket) {
      this.socket.off(event, cb);
      this.socket.on(event, cb);
    }
  }

  off(event, cb) {
    if (this.socket) {
      if (cb) this.socket.off(event, cb);
      else this.socket.off(event);
    }
    if (!this.eventHandlers.has(event)) return;
    if (cb) {
      this.eventHandlers.get(event).delete(cb);
      if (this.eventHandlers.get(event).size === 0) this.eventHandlers.delete(event);
    } else {
      this.eventHandlers.delete(event);
    }
  }

  onEvent(event, cb) {
    if (!this.internalHandlers.has(event)) this.internalHandlers.set(event, new Set());
    this.internalHandlers.get(event).add(cb);
  }
  offEvent(event, cb) {
    if (!this.internalHandlers.has(event)) return;
    if (cb) this.internalHandlers.get(event).delete(cb);
    else this.internalHandlers.delete(event);
  }

  emit(event, data, ack) {
    if (!this.socket || !this.connected) {
      console.warn("[socketService] cannot emit - not connected", event);
      return;
    }
    this.socket.emit(event, data, ack);
  }
}

export const socketService = new SocketService();
