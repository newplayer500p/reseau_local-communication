// evenement.route.js
import express from "express";
import * as controller from "../controllers/evenement.controller.js";

const evenement_router = express.Router();

evenement_router.get("/", controller.getAnnonces);

evenement_router.get("/:id", controller.getAnnonceById);

evenement_router.post("/", controller.createAnnonce);

evenement_router.delete("/:id", controller.deleteAnnonce);

export default evenement_router;
