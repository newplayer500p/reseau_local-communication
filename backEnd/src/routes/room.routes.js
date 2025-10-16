import express from 'express';
import { listRoom, onCreateRoom, onDeleteRoom, onJoinRoom, updateRoom } from "../controllers/rooms.controller.js";

const router_room = express.Router();

router_room.post('/join/:roomId', onJoinRoom);
router_room.post("/delete/:roomId", onDeleteRoom);
router_room.post("/create", onCreateRoom);
router_room.post("/update/:roomId", updateRoom);
router_room.post("/listRoom", listRoom);

export default router_room;