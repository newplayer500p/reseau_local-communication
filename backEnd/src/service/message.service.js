// services/message.service.js
import Message from '../models/Message.model.js';
import Room from '../models/Room.model.js';
import mongoose from 'mongoose';

const sanitizeMsg = (m) => {
  const o = m.toObject ? m.toObject() : { ...m };
  return o;
};

/**
 * Save message (used by socket and HTTP POST)
 * payload: { room, sender (email), type, text, file }
 */
export const sendMessage = async ({ room, sender, type = 'text', text = '', file = null }) => {
  if (!room || !sender) throw new Error('room et sender requis');

  // verify room exists
  const roomDoc = await Room.findOne({ id: room });
  if (!roomDoc) throw new Error('Salle introuvable');

  if (type === 'text') {
    if (!text || String(text).trim() === '') throw new Error('Le texte est requis pour un message de type text');
  } else if (type === 'file') {
    if (!file || !file.url) throw new Error('Les métadonnées fichier sont requises');
    // file.size déjà contrôlée côté upload
  } else {
    throw new Error('Type de message inconnu');
  }

  const msg = await Message.create({
    room,
    sender,
    type,
    text: type === 'text' ? text : '',
    file: type === 'file' ? file : null,
    createdAt: new Date(),
  });

  return sanitizeMsg(msg);
};

export const listMessages = async (roomId, { limit = 50, before = null } = {}) => {
  const query = { room: roomId };
  if (before) query.createdAt = { $lt: new Date(before) };
  const msgs = await Message.find(query).sort({ createdAt: -1 }).limit(limit).lean();
  return msgs.reverse(); // chronological order
};