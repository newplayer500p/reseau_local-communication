const rooms = new Map(); // roomId -> Set of emails

export const addPresence = (roomId, email) => {
  if (!rooms.has(roomId)) rooms.set(roomId, new Set());
  rooms.get(roomId).add(email);
};

export const removePresence = (roomId, email) => {
  if (!rooms.has(roomId)) return;
  rooms.get(roomId).delete(email);
  if (rooms.get(roomId).size === 0) rooms.delete(roomId);
};

export const listPresence = (roomId) => {
  if (!rooms.has(roomId)) return [];
  return Array.from(rooms.get(roomId));
};

export const isPresent = (roomId, email) => {
  return rooms.has(roomId) && rooms.get(roomId).has(email);
};