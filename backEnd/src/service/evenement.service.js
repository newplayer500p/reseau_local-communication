// evenement.service.js
import Evenement from "../models/Evenement.model.js";

/**
 * createEvent(data) -> crée et retourne l'événement
 * getEvents(filter, opts) -> liste d'événements (filtre, pagination)
 * getEventById(id) -> événement unique
 * deleteEventById(id) -> supprime
 */

export async function createEvent(data) {
  const ev = new Evenement(data);
  await ev.save();
  return ev.toObject();
}

export async function getEvents(filter = {}, { skip = 0, limit = 50, sort = { publishedAt: -1 } } = {}) {
  const query = Evenement.find(filter)
    .sort(sort)
    .skip(parseInt(skip, 10))
    .limit(parseInt(limit, 10));
  const items = await query.exec();
  const total = await Evenement.countDocuments(filter);
  return { items, total };
}

export async function getEventById(id) {
  return Evenement.findById(id).exec();
}

export async function deleteEventById(id) {
  const ev = await Evenement.findByIdAndDelete(id).exec();
  return ev;
}
