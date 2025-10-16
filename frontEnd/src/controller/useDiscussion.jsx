import { useState, useCallback } from "react";
import { api } from "../service/axios.service";

export const useDiscussions = () => {
  const [rooms, setRooms] = useState([]);
  const [messages, setMessages] = useState({});
  const [activeRoomId, setActiveRoomId] = useState(null);

  const fetchRooms = useCallback(async () => {
    try {
      const res = await api.post("/room/listRoom");
      if (res?.data?.ok) {
        setRooms(res.data.room);
      }
    } catch (err) {
      console.error("Erreur lors de la récupération des salons", err);
    }
  }, []);

  const handleNewMessage = useCallback(
    (msg) => {
      if (!msg || !msg.room) return;

      setMessages((prev) => {
        const roomId = msg.room;
        const prevRoom = prev[roomId] || [];

        // compare by _id or id or createdAt+text
        const incomingId = msg._id || msg.id || null;
        const exists = prevRoom.some((m) => {
          const mid = m._id || m.id || null;
          if (incomingId && mid) return incomingId === mid;
          // fallback stricter check
          return (
            m.createdAt === msg.createdAt &&
            m.sender === msg.sender &&
            m.type === msg.type &&
            m.text === msg.text
          );
        });
        if (exists) return prev;

        // append message (or insert in chronological order if needed)
        return { ...prev, [roomId]: [...prevRoom, msg] };
      });
    },
    [setMessages]
  );

  function mergeHistory(prevRoomMsgs, history) {
    const map = new Map();
    // add existing
    (prevRoomMsgs || []).forEach((m) => {
      const key = m._id || m.id || m.createdAt + "|" + (m.sender || "");
      map.set(key, m);
    });
    // add history
    (history || []).forEach((m) => {
      const key = m._id || m.id || m.createdAt + "|" + (m.sender || "");
      map.set(key, m);
    });

    // return as array sorted by createdAt if you want chronological
    return Array.from(map.values()).sort(
      (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
    );
  }

  return {
    rooms,
    setRooms,
    messages,
    setMessages,
    activeRoomId,
    setActiveRoomId,
    fetchRooms,
    handleNewMessage,
    mergeHistory
  };
};
