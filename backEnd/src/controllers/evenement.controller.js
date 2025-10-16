// evenement.controller.js
import * as eventService from "../service/evenement.service.js";
import { broadcastEvent } from "../utils/helperBroadcast.js";

export async function createAnnonce(req, res) {
  try {
    // req.body expected to contain: title, description, priority, eventDate, attachments, metadata
    const payload = {
      title: req.body.title,
      description: req.body.description,
      priority: req.body.priority || "moyen",
      createdBy: {
        email: req.email,
      },
      publishedAt: req.body.publishedAt || new Date(),
      eventDate: req.body.eventDate || null,
      attachments: req.body.attachments || [],
      metadata: req.body.metadata || {},
    };

    // validation basique
    if (!payload.title)
      return res.status(400).json({ error: "title is required" });

    const ev = await eventService.createEvent(payload);

    broadcastEvent(req.app, "anonces-changed", {
      action: "create",
    });

    // Option: émettre un socket.io event pour notifier les clients en temps réel
    // req.app.get('io')?.emit('evenement:created', ev);

    return res.status(201).json(ev);
  } catch (err) {
    console.error("createAnnonce error:", err);
    return res
      .status(500)
      .json({ error: "Erreur serveur lors de la création de l'annonce" });
  }
}

export async function deleteAnnonce(req, res) {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ error: "id manquant" });

    const existing = await eventService.getEventById(id);
    if (!existing)
      return res.status(404).json({ error: "Annonce non trouvée" });

    // Option: vérifier permission (ex: req.user est author ou admin)
    // if (String(existing.createdBy.userId) !== String(req.user?.id) && !req.user?.isAdmin) return res.status(403).json({ error: "Non autorisé" });

    await eventService.deleteEventById(id);

    broadcastEvent(req.app, "anonces-changed", {
      action: "delete",
    });

    return res.json({ success: true, id });
  } catch (err) {
    console.error("deleteAnnonce error:", err);
    return res
      .status(500)
      .json({ error: "Erreur serveur lors de la suppression" });
  }
}

export async function getAnnonces(req, res) {
  try {
    const { priority, skip = 0, limit = 50 } = req.query;
    const filter = {};
    if (priority) filter.priority = priority;

    // filtrer par date, room, createdBy, metadata, etc.
    if (req.query.roomId) filter["metadata.roomId"] = req.query.roomId;

    const result = await eventService.getEvents(filter, { skip, limit });
    return res.json(result);
  } catch (err) {
    console.error("getAnnonces error:", err);
    return res
      .status(500)
      .json({ error: "Erreur serveur lors de la récupération des annonces" });
  }
}

export async function getAnnonceById(req, res) {
  try {
    const id = req.params.id;
    const ev = await eventService.getEventById(id);
    if (!ev) return res.status(404).json({ error: "Annonce non trouvée" });
    return res.json(ev);
  } catch (err) {
    console.error("getAnnonceById error:", err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}
