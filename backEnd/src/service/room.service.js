// services/room.service.js
import bcrypt from 'bcryptjs';
import Room from '../models/Room.model.js';
import { getUserByEmail } from './user.service.js';

/**
 * Helper: sanitize room object before returning (remove passwordHash).
 */
const sanitizeRoom = (roomDoc) => {
  if (!roomDoc) return null;
  const r = roomDoc.toObject ? roomDoc.toObject() : { ...roomDoc };
  delete r.passwordHash;
  return r;
};

export const createRoom = async (roomData) => {
  const { id, title, description = '', password, createdBy } = roomData || {};

  if (!id || !title || !createdBy) {
    throw new Error('Champ(s) manquant(s) : id et title et createdBy sont requis.');
  }

  // Vérifier unicité selon ton champ `id`
  const existing = await Room.findOne({ id });
  if (existing) {
    throw new Error('Un salon avec cet id existe déjà.');
  }

  const user = await getUserByEmail(createdBy);
  if (user === null){
    throw new Error("Le personne crateur indisponnible")
  }

  const passwordHash = password ? await bcrypt.hash(password, 10) : null;
  const isPrivate = !!password;

  const room = new Room({
    id,
    title,
    description,
    passwordHash,
    createdBy: createdBy,
    isPrivate,
    createdAt: new Date(),
  });

  await room.save();

  return sanitizeRoom(room);
};


export const joinRoom = async (roomId, password = '') => {
  if (!roomId) throw new Error('roomId requis.');

  const room = await Room.findOne({ id: roomId });
  if (!room) {
    const err = new Error('Salle introuvable.');
    err.code = 'ROOM_NOT_FOUND';
    throw err;
  }

  const ok = await room.checkPassword(password);
  if (!ok) {
    const err = new Error('Mot de passe incorrect.');
    err.code = 'INVALID_PASSWORD';
    throw err;
  }

  // Optionnel: ici on pourrait ajouter une logique d'enregistrement de la présence du user
  return sanitizeRoom(room);
};


export const deleteRoom = async (email, roomId, password = '') => {
  if (!roomId) throw new Error('roomId requis.');
  if (!email) throw new Error("L'email de l'utilisateur est requis.");

  const room = await Room.findOne({ id: roomId });
  if (!room) {
    const err = new Error('Salle introuvable.');
    err.code = 'ROOM_NOT_FOUND';
    throw err;
  }

  const user = await getUserByEmail(email);
  if (!user) {
    const err = new Error("Utilisateur non trouvé.");
    err.code = 'USER_NOT_FOUND';
    throw err;
  }

  const isAdmin = process.env.ADMIN_EMAIL && process.env.ADMIN_EMAIL === email;
  // room.createdBy peut être ObjectId ou email string selon ta logique de stockage
  const createdByMatch =
    room.createdBy &&
    (room.createdBy.toString() === user._id.toString() || room.createdBy === email);

  if (!isAdmin && !createdByMatch) {
    const err = new Error("Non autorisé : seul le créateur ou l'administrateur peut supprimer cette salle.");
    err.code = 'FORBIDDEN';
    throw err;
  }

  // Si admin -> bypass vérification du mot de passe
  if (!isAdmin && room.passwordHash) {
    const ok = await room.checkPassword(password);
    if (!ok) {
      const err = new Error('Mot de passe incorrect — suppression refusée.');
      err.code = 'INVALID_PASSWORD';
      throw err;
    }
  }

  // suppression (penser éventuellement à supprimer messages associés)
  await Room.deleteOne({ id: roomId });
  return { deleted: true };
};

export const changeRoom = async (email, roomId, roomType, password = '') => {
  if (!roomId) throw new Error('roomId requis.');
  if (!email) throw new Error("L'email de l'utilisateur est requis.");

  const room = await Room.findOne({ id: roomId });
  if (!room) {
    const err = new Error('Salle introuvable.');
    err.code = 'ROOM_NOT_FOUND';
    throw err;
  }

  const user = await getUserByEmail(email);
  if (!user) {
    const err = new Error("Utilisateur non trouvé.");
    err.code = 'USER_NOT_FOUND';
    throw err;
  }

  const isAdmin = process.env.ADMIN_EMAIL && process.env.ADMIN_EMAIL === email;
  const createdByMatch =
    room.createdBy &&
    (room.createdBy.toString() === user._id.toString() || room.createdBy === email);

  if (!isAdmin && !createdByMatch) {
    const err = new Error("Non autorisé : seul le créateur ou l'administrateur peut modifier cette salle.");
    err.code = 'FORBIDDEN';
    throw err;
  }

  // Normalisation du type
  let makePrivate;
  if (typeof roomType === 'string') {
    makePrivate = ['private', 'privé', 'prive', 'true', '1'].includes(roomType.toLowerCase());
  } else {
    makePrivate = Boolean(roomType);
  }

  // Vérification du mot de passe courant si la room a déjà un mot de passe et si l'utilisateur n'est pas admin
  if (!isAdmin && room.passwordHash) {
    const ok = await room.checkPassword(password);
    if (!ok) {
      const err = new Error('Mot de passe incorrect — modification refusée.');
      err.code = 'INVALID_PASSWORD';
      throw err;
    }
  }

  if (makePrivate) {
    // Pour rendre privée : si room avait déjà un mot de passe, on peut réutiliser celui fourni (déjà vérifié ci-dessus)
    // Si room n'avait pas de mot de passe, on exige la création d'un nouveau mot de passe
    if (!room.passwordHash && !password) {
      throw new Error('Un mot de passe est requis pour rendre la salle privée.');
    }
    // Si password fourni => (re)hash et met à jour; sinon (cas where it already had one and we verified it) on conserve l'ancien hash
    if (password) {
      room.passwordHash = await bcrypt.hash(password, 10);
    }
    room.isPrivate = true;
  } else {
    // Rendre publique : supprime passwordHash
    room.passwordHash = null;
    room.isPrivate = false;
  }

  await room.save();
  return sanitizeRoom(room);
};

export const listRooms = async () => {
  const rooms = await Room.find().sort({ createdAt: -1 });
  return rooms.map((r) => sanitizeRoom(r));
};